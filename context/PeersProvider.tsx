import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, Peer, PeerContextType, Chat } from "./types";
import { ReactNode, createContext, useState } from "react";

export const PeerContext = createContext<PeerContextType | null>(null);


/**
 * Provides the context for managing peers in a video call.
 * @param props - The component props.
 * @param props.children - The child components.
 * @returns The PeerProvider component.
 */
export const PeerProvider = (props: {
    children: ReactNode;
}) => {
    // State to store the list of connected peers
    const [peers, setPeers] = useState<Peer[]>([]);

    // State to store the local stream
    const [myStream, setMyStream] = useState<MediaStream | null>(null);

    // State to store the chat history
    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    // State to store the unread status of the chat window
    const [chatUnread, setChatUnread] = useState<boolean>(false);
    // State to store the visibility of the chat window
    const [chatVisible, setChatVisibleAct] = useState<boolean>(false);

    // State to store the audio stream
    const [audioStream, setAudioStream] = useState<MediaStream>(new MediaStream());

    // State to store the list of pending user requests
    const [userRequests, setUserRequests] = useState<{
        socketId: string,
        user: {
            name: string,
            image: string,
            email: string
        }
    }[]>([]);

    // Function to get the peer object from the list of connected peers
    const getPeerBySocketId = (socketId: string) => {
        return peers.find(peer=>peer.socketId === socketId)?.peer;
    }

    // Function to handle the track event
    const handleTrackEvent = async (event: RTCTrackEvent, socketId: string, socket:Socket<ServerToClientEvents, ClientToServerEvents>) => {
        setPeers(prev=>{
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
                }
                return peer;
            });
            return newPeers;
        });
    };

    // Function to handle the ice candidate event
    const handleSendIceCandidate = async (event: RTCPeerConnectionIceEvent, to: string, socket:Socket<ServerToClientEvents, ClientToServerEvents>) => {
        if(event.candidate)
            socket.emit("iceCandidate", {candidate: event.candidate, to});
    };

    // Function to handle the negotiation needed event
    const handleNegoInit = async (peer: RTCPeerConnection, to:string, socket:Socket<ServerToClientEvents, ClientToServerEvents>)=>{
        const offerDescription = await peer.createOffer();
        await peer.setLocalDescription(offerDescription);
        socket.emit("negoOffer", {offer: offerDescription, to});
    };

    // Function to create a new peer connection
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
        setUserRequests(prev=>prev.filter(req=>req.socketId !== socketId));
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

    // Function to save the offer received from the remote peer and create an answer
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

    // Function to save the answer received from the remote peer
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

    // Function to save the ICE candidate received from the remote peer
    const saveIceCandidate = async (socketId: string, candidate: RTCIceCandidate) => {
        const peer = getPeerBySocketId(socketId);
        if(peer)
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
    }

    // Function to send the local stream to all connected peers
    const sendStream = async (stream: MediaStream) => {
        peers.forEach(({peer}) => {
            stream.getTracks().forEach((track) => {
                peer.addTrack(track, stream);
            });
        });
        setMyStream(stream);
    }

    // Function to stop the local stream and notify all connected peers
    const stopStream = async (socket: Socket<ServerToClientEvents, ClientToServerEvents>, type: 'audio' | 'video' | 'presentation') => {
        peers.forEach(({socketId}) => {
            socket.emit("streamStopped", socketId, type);
        });
        setMyStream(null);
    }

    // Function to clear tracks of a specific type for a given peer
    const clearTracks = async (socketId: string, type: 'audio' | 'video' | 'presentation') => {
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

    // Function to send a chat message to all connected peers
    const sendChat = (socket: Socket<ServerToClientEvents, ClientToServerEvents>, message: string) => {
        setChatHistory(prev=>[...prev, {sender: "You", message, time: new Date()}]);
        peers.forEach(({socketId}) => {
            socket.emit("chatSend", socketId, message);
        });
    }

    // Function to receive a chat message from a remote peer
    const receiveChat = (sender: string, message: string) => {
        setChatHistory(prev=>[...prev, {
            sender: peers.find(peer=>peer.socketId === sender)?.user?.name || 'Unknown',
            message,
            time: new Date()
        }]);
        if(!chatVisible) setChatUnread(true);
    }

    // Function to update the state of peers after rendering stream updates
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

    // Function to remove a peer from the list of connected peers
    const removePeer = (socketId: string) => {
        setPeers(prev=>{
            const newPeers = prev.filter(peer=>peer.socketId !== socketId);
            return newPeers;
        });
    };

    // Function to set the visibility of the chat window
    const setChatVisible = (b: boolean) => {
        if(b) setChatUnread(false);
        setChatVisibleAct(b);
    }

    // Function to add a user request to the list of pending requests
    const addUserRequest = (socketId: string, user: {
        name: string,
        image: string,
        email: string
    }) => {
        if(!userRequests.find(req=>req.socketId === socketId))
            setUserRequests(prev=>[...prev, {socketId, user}]);
    }

    // Function to accept a user request and emit the acceptance event
    const acceptUser = (socket: Socket<ServerToClientEvents, ClientToServerEvents>, roomId: string,  socketId: string) => {
        setUserRequests(prev=>prev.filter(req=>req.socketId !== socketId));
        socket.emit("userAccepted", roomId, socketId);
    }

    // Function to ignore a user request
    const ignoreRequest = (socketId: string) => {
        setUserRequests(prev=>prev.filter(req=>req.socketId !== socketId));
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
            audioStream,
            ignoreRequest
        }}>
            {props.children}
        </PeerContext.Provider>
    );
}