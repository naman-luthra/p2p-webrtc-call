import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, Peer, PeerContextType } from "./types";
import { ReactNode, createContext, useState } from "react";

export const PeerContext = createContext<PeerContextType | null>(null);

export const PeerProvider = (props: {
    children: ReactNode;
}) => {
    const [peers, setPeers] = useState<Peer[]>([]);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);

    const getPeerBySocketId = (socketId: string) => {
        return peers.find(peer=>peer.socketId === socketId)?.peer;
    }

    const handleTrackEvent = async (event: RTCTrackEvent, socketId: string, socket:Socket<ServerToClientEvents, ClientToServerEvents>) => {
        console.log("track event", event);
        setPeers(prev=>{
            console.log("adding track...");
            const newPeers = prev.map(peer=>{
                if(peer.socketId === socketId){
                    if(!peer.stream) peer.stream = new MediaStream();
                    event.streams[0].getTracks().forEach((track) => {
                        if(track.kind === "audio")
                            peer.audio = true;
                        else if(track.kind === "video")
                            peer.video = true;
                        peer.stream?.addTrack(track);
                    });
                    console.log(peer.stream?.getTracks());
                }
                return peer;
            });
            //handleNegoInit(newPeers[i].peer, newPeers[i].socketId, socket);
            return newPeers;
        });
    };

    const handleSendIceCandidate = async (event: RTCPeerConnectionIceEvent, to: string, socket:Socket<ServerToClientEvents, ClientToServerEvents>) => {
        if(event.candidate)
            socket.emit("iceCandidate", {candidate: event.candidate, to});
    };

    const handleNegoInit = async (peer: RTCPeerConnection, to:string, socket:Socket<ServerToClientEvents, ClientToServerEvents>)=>{
        const offerDescription = await peer.createOffer();
        await peer.setLocalDescription(offerDescription);
        socket.emit("negoOffer", {offer: offerDescription, to});
    };

    const createPeer = (socketId: string, socket: Socket<ServerToClientEvents, ClientToServerEvents>) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                {
                  urls: "stun:stun.relay.metered.ca:80",
                },
                {
                  urls: "turn:a.relay.metered.ca:80",
                  username: process.env.NEXT_PUBLIC_TURN_USERNAME,
                  credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
                },
                {
                  urls: "turn:a.relay.metered.ca:80?transport=tcp",
                  username: process.env.NEXT_PUBLIC_TURN_USERNAME,
                  credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
                },
                {
                  urls: "turn:a.relay.metered.ca:443",
                  username: process.env.NEXT_PUBLIC_TURN_USERNAME,
                  credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
                },
                {
                  urls: "turn:a.relay.metered.ca:443?transport=tcp",
                  username: process.env.NEXT_PUBLIC_TURN_USERNAME,
                  credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
                },
            ],
        });
        if(myStream){
            myStream.getTracks().forEach((track) => {
                peer.addTrack(track, myStream);
            });
        }
        peer.addEventListener("icecandidate", (event) => handleSendIceCandidate(event, socketId, socket));
        peer.addEventListener("negotiationneeded", () => handleNegoInit(peer, socketId, socket));
        peer.addEventListener("track", (event) => handleTrackEvent(event, socketId, socket));
        setPeers(prev=>{
            return [...prev, {
                name: "New Peer",
                socketId, 
                peer,
                stream: new MediaStream(),
                audio: false,
                video: false
            }];
        });
        return peer;
    };

    const createOffer = async (d: string | RTCPeerConnection) => {
        let peer: RTCPeerConnection | undefined;
        if(typeof d === "string"){
            peer = getPeerBySocketId(d);
        }
        else{
            peer = d;
        }
        if(peer){
            const offerDescription = await peer.createOffer();
            await peer.setLocalDescription(offerDescription);
            return offerDescription;
        }
    }

    const saveOfferAndCreateAnswer = async (d: string | RTCPeerConnection, offer: RTCSessionDescriptionInit) => {
        let peer: RTCPeerConnection | undefined;
        if(typeof d === "string"){
            peer = getPeerBySocketId(d);
        }
        else{
            peer = d;
        }
        if(peer){
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(new RTCSessionDescription(answer));
            return answer;
        }
    }
    
    const saveAnswer = async (socketId: string, answer: RTCSessionDescriptionInit) => {
        const peer = getPeerBySocketId(socketId);
        if(peer)
            await peer.setRemoteDescription(new RTCSessionDescription(answer));
    }

    const saveIceCandidate = async (socketId: string, candidate: RTCIceCandidate) => {
        const peer = getPeerBySocketId(socketId);
        if(peer)
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
    }

    const sendStream = async (stream: MediaStream) => {
        console.log("send stream", stream);
        peers.forEach(({peer}) => {
            stream.getTracks().forEach((track) => {
                peer.addTrack(track, stream);
            });
        });
        setMyStream(stream);
    }

    const stopStream = async (socket: Socket<ServerToClientEvents, ClientToServerEvents>, type: 'audio' | 'video' | 'presentation') => {
        peers.forEach(({socketId}) => {
            socket.emit("streamStopped", socketId, type);
        });
        setMyStream(null);
    }

    const clearTracks = async (socketId: string, type: 'audio' | 'video' | 'presentation') => {
        console.log("clear tracks", socketId);
        setPeers(prev=>{
            const newPeers = prev.map(peer=>{
                if(peer.socketId === socketId){
                    const newTracks: MediaStreamTrack[] = [];
                    peer.stream?.getTracks().forEach(track=>{
                        if(type==='presentation') track.stop();
                        else if(track.kind === type)
                            track.stop();
                        else newTracks.push(track);
                    });
                    peer.stream = new MediaStream(newTracks);
                    if(type==='audio') peer.audio = false;
                    else if(type==='video') peer.video = false;
                    else if(type==='presentation'){
                        peer.audio = false;
                        peer.video = false;
                    }
                }
                return peer;
            })
            return newPeers;
        });
    }

    const removePeer = (socketId: string) => {
        setPeers(prev=>{
            const newPeers = prev.filter(peer=>peer.socketId !== socketId);
            return newPeers;
        });
    };

    return (
        <PeerContext.Provider value={{
            peers,
            createPeer,
            createOffer,
            saveOfferAndCreateAnswer,
            saveAnswer,
            saveIceCandidate,
            sendStream,
            myStream,
            stopStream,
            clearTracks,
            removePeer
        }}>
            {props.children}
        </PeerContext.Provider>
    );
}