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

    const handleTrackEvent = async (event: RTCTrackEvent, i: number) => {
        console.log("track event", event);
        setPeers(prev=>{
            console.log("adding track...");
            const newPeers = [...prev];
            if(!newPeers[i].stream) newPeers[i].stream = new MediaStream();

            event.streams[0].getTracks().forEach((track) => {
                newPeers[i].stream?.addTrack(track);
            });
            console.log(newPeers[i].stream?.getTracks());
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
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:global.stun.twilio.com:3478",
                ],
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
        peer.addEventListener("track", (event) => handleTrackEvent(event, peers.length));
        setPeers(prev=>{
            return [...prev, {socketId, peer, stream: null}];
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

    const stopStream = async (socket: Socket<ServerToClientEvents, ClientToServerEvents>) => {
        peers.forEach(({socketId}) => {
            socket.emit("streamStopped", socketId);
        });
        setMyStream(null);
    }

    const clearTracks = async (socketId: string) => {
        console.log("clear tracks", socketId);
        setPeers(prev=>{
            const newPeers = prev.map(peer=>{
                if(peer.socketId === socketId){
                    peer.stream?.getTracks().forEach(track=>track.stop());
                    peer.stream = null;
                }
                return peer;
            })
            return newPeers;
        });
    }

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
            clearTracks
        }}>
            {props.children}
        </PeerContext.Provider>
    );
}