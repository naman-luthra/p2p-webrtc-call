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
    clearTracks: (sender: string) => void;
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
    streamStopped: (to: string) => void;
}

export interface Peer {
    socketId: string;
    peer: RTCPeerConnection;
    stream: MediaStream | null;
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
    stopStream: (socket: Socket<ServerToClientEvents, ClientToServerEvents>) => void;
    clearTracks: (to: string) => void;
    removePeer: (socketId: string) => void;
}