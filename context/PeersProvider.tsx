import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, Peer, PeerContextType, Chat } from "./types";
import { ReactNode, createContext, useState } from "react";

export const PeerContext = createContext<PeerContextType | null>(null);

export const PeerProvider = (props: {
    children: ReactNode;
}) => {
    const [peers, setPeers] = useState<Peer[]>([]);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);

    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    const [chatUnread, setChatUnread] = useState<boolean>(false);
    const [chatVisible, setChatVisibleAct] = useState<boolean>(false);

    const [audioStream, setAudioStream] = useState<MediaStream>(new MediaStream());

    const [userRequests, setUserRequests] = useState<{
        socketId: string,
        user: {
            name: string,
            image: string,
            email: string
        }
    }[]>([]);

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
                        if(track.kind === "audio"){
                            peer.audio = {
                                playing: true,
                                changed: true
                            };
                            peer.audioTracks.push(track);
                            setAudioStream(prev=>{
                                prev.addTrack(track);
                                return prev;
                            });
                        }
                        else if(track.kind === "video"){
                            peer.video = {
                                playing: true,
                                changed: true
                            };
                            peer.stream?.addTrack(track);
                        }
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

    const createPeer = (socketId: string, socket: Socket<ServerToClientEvents, ClientToServerEvents>, userDetails: {
        name: string,
        image: string,
        email: string
    } | null) => {
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
                user: userDetails,
                socketId, 
                peer,
                stream: new MediaStream(),
                audioTracks: [],
                audio: {
                    playing: false,
                    changed: true
                },
                video: {
                    playing: false,
                    changed: true
                }
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

    const saveOfferAndCreateAnswer = async (d: string | RTCPeerConnection, offer: RTCSessionDescriptionInit, senderDetails: {
        name: string,
        image: string,
        email: string
    } | null) => {
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
    
    const saveAnswer = async (socketId: string, answer: RTCSessionDescriptionInit, userDetails: {
        name: string,
        image: string,
        email: string
    } | null) => {
        const peer = getPeerBySocketId(socketId);
        if(peer)
            await peer.setRemoteDescription(new RTCSessionDescription(answer));
        if(userDetails){
            setPeers(prev=>{
                const newPeers = prev.map(peer=>{
                    if(peer.socketId === socketId){
                        peer.user = userDetails;
                    }
                    return peer;
                });
                return newPeers;
            });
        }
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
                    if(type==='video' || type==='presentation'){
                        peer.stream?.getTracks().forEach(track=>{
                            setAudioStream(prev=>{
                                prev.removeTrack(track);
                                return prev;
                            });
                            track.stop();
                        });
                        peer.stream = new MediaStream();
                    }
                    else{
                        peer.audioTracks.forEach(track=>{
                            track.stop();
                        });
                        peer.audioTracks = [];
                    }
                    if(type==='audio') peer.audio = {
                        playing: false,
                        changed: true
                    };
                    else if(type==='video') peer.video = {
                        playing: false,
                        changed: true
                    };
                    else if(type==='presentation'){
                        peer.audio = {
                            playing: false,
                            changed: true
                        };
                        peer.video = {
                            playing: false,
                            changed: true
                        };
                    }
                }
                return peer;
            })
            return newPeers;
        });
    }

    const sendChat = (socket: Socket<ServerToClientEvents, ClientToServerEvents>, message: string) => {
        setChatHistory(prev=>[...prev, {sender: "You", message, time: new Date()}]);
        peers.forEach(({socketId}) => {
            socket.emit("chatSend", socketId, message);
        });
    }

    const receiveChat = (sender: string, message: string) => {
        console.log("message",sender,peers)
        setChatHistory(prev=>[...prev, {
            sender: peers.find(peer=>peer.socketId === sender)?.user?.name || 'Unknown',
            message,
            time: new Date()
        }]);
        if(!chatVisible) setChatUnread(true);
    }

    const streamsUpdatesRendered = () => {
        setPeers(
            prev=>{
                const newPeers = prev.map(peer=>{
                    peer.audio.changed = false;
                    peer.video.changed = false;
                    return peer;
                });
                return newPeers;
            }
        );
    }

    const removePeer = (socketId: string) => {
        setPeers(prev=>{
            const newPeers = prev.filter(peer=>peer.socketId !== socketId);
            return newPeers;
        });
    };

    const setChatVisible = (b: boolean) => {
        if(b) setChatUnread(false);
        setChatVisibleAct(b);
    }

    const addUserRequest = (socketId: string, user: {
        name: string,
        image: string,
        email: string
    }) => {
        if(!userRequests.find(req=>req.socketId === socketId))
            setUserRequests(prev=>[...prev, {socketId, user}]);
    }

    const acceptUser = (socket: Socket<ServerToClientEvents, ClientToServerEvents>, roomId: string,  socketId: string) => {
        setUserRequests(prev=>prev.filter(req=>req.socketId !== socketId));
        socket.emit("userAccepted", roomId, socketId);
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
            clearTracks,
            removePeer,
            chatHistory,
            chatUnread,
            chatVisible,
            setChatVisible,
            sendChat,
            receiveChat,
            streamsUpdatesRendered,
            addUserRequest,
            userRequests,
            acceptUser,
            audioStream
        }}>
            {props.children}
        </PeerContext.Provider>
    );
}