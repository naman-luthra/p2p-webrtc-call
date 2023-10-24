import { Socket } from "socket.io-client";

export interface ServerToClientEvents {
    createOffers: (connections: {
        sockets: string[],
        roomId: string
    }) => void;
    acceptOffer: (offerWithSender: {
        offer: RTCSessionDescriptionInit,
        sender: string,
        roomId: string
    }) => void;
    saveAnswer: (answerWithPeer: {
        answer: RTCSessionDescriptionInit,
        sender: string
    }) => void;
    negoOfferAccept: (offerWithSender: {
        offer: RTCSessionDescriptionInit,
        sender: string
    }) => void;
    negoSaveAnswer: (answerWithPeer: {
        answer: RTCSessionDescriptionInit,
        sender: string
    }) => void;
    saveIceCandidate: (candidateWithPeer: {
        candidate: RTCIceCandidate,
        sender: string
    }) => void;
    clearTracks: (sender: string, type: 'audio' | 'video' | 'presentation') => void;
    socketDisconnected: (socketId: string) => void;
}

export interface ClientToServerEvents {
    roomJoined: (roomId: string) => void;
    roomLeft: (roomId: string) => void;
    offersCreated: (roomId: string, offers: {offer: RTCSessionDescriptionInit, to:string}[]) => void;
    answerCreated: (answerWithReceiver: {
        roomId: string,
        answer: RTCSessionDescriptionInit,
        receiver: string
    }) => void;
    negoOffer: (offerWithReceiver: {
        offer: RTCSessionDescriptionInit,
        to: string
    }) => void;
    negoAnswerCreated: (answerWithReceiver: {
        answer: RTCSessionDescriptionInit,
        to: string
    }) => void;
    iceCandidate: (candidateWithReceiver: {
        candidate: RTCIceCandidate,
        to: string
    }) => void;
    streamStopped: (to: string, type: 'audio' | 'video' | 'presentation') => void;
}

export interface Peer {
    name: string;
    socketId: string;
    peer: RTCPeerConnection;
    stream: MediaStream | null;
    audio: boolean;
    video: boolean;
}

export interface PeerContextType {
    peers: Peer[];
    myStream: MediaStream | null;
    sendStream: (stream: MediaStream) => void;
    createPeer: (socketId: string, socket: Socket<ServerToClientEvents, ClientToServerEvents>) => RTCPeerConnection;
    createOffer: (d: string | RTCPeerConnection) => Promise<RTCSessionDescriptionInit | undefined>;
    saveOfferAndCreateAnswer: (d: string | RTCPeerConnection, offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | undefined>;
    saveAnswer: (socketId: string, answer: RTCSessionDescriptionInit) => Promise<void>;
    saveIceCandidate: (socketId: string, candidate: RTCIceCandidate) => Promise<void>;
    stopStream: (socket: Socket<ServerToClientEvents, ClientToServerEvents>, type: 'audio' | 'video' | 'presentation') => void;
    clearTracks: (to: string, type: 'audio' | 'video') => void;
    removePeer: (socketId: string) => void;
}