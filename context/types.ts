import { Socket } from "socket.io-client";

export interface ServerToClientEvents {
    createOffers: (connections: {
        sockets: string[],
        roomId: string
    }) => void;
    acceptOffer: (offerWithSender: {
        offer: RTCSessionDescriptionInit,
        sender: string,
        senderDetails:{
            name: string,
            image: string,
            email: string
        },
        roomId: string
    }) => void;
    saveAnswer: (answerWithPeer: {
        answer: RTCSessionDescriptionInit,
        sender: string,
        senderDetails:{
            name: string,
            image: string,
            email: string
        }
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
    chatReceive: (messageWithSender: {
        sender: string,
        message: string
    }) => void;
    userRequestJoinRoom: (socketIdWithUser: {
        socketId: string,
        user: {
            name: string,
            image: string,
            email: string
        }
    }) => void;
    joinRequestAccepted: (roomId: string, secret: string) => void;
}

export interface ClientToServerEvents {
    roomJoined: (roomId: string, secret: string) => void;
    requestJoinRoom: (roomId: string, user: {
        name: string,
        image: string,
        email: string
    }) => void;
    roomLeft: (roomId: string) => void;
    offersCreated: (
        roomId: string, 
        offers: {
            offer: RTCSessionDescriptionInit, 
            to:string,
            senderDetails:{
                name: string,
                image: string,
                email: string
            }
        }[]
    ) => void;
    answerCreated: (answerWithReceiver: {
        roomId: string,
        answer: RTCSessionDescriptionInit,
        receiver: string,
        senderDetails:{
            name: string,
            image: string,
            email: string
        }
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
    chatSend: (to: string, message: string) => void;
    userAccepted: (roomId: string, to: string) => void;
}

export interface Peer {
    user: {
        name: string,
        image: string,
        email: string
    } | null;
    socketId: string;
    peer: RTCPeerConnection;
    stream: MediaStream | null;
    audioTracks: MediaStreamTrack[];
    audio: {
        playing: boolean;
        changed: boolean;
    };
    video: {
        playing: boolean;
        changed: boolean;
    };
}

export interface Chat {
    message: string,
    sender: string,
    time: Date
}

export interface PeerContextType {
    peers: Peer[];
    myStream: MediaStream | null;
    audioStream: MediaStream;
    sendStream: (stream: MediaStream) => void;
    createPeer: (socketId: string, socket: Socket<ServerToClientEvents, ClientToServerEvents>, userDetails: {
        name: string,
        image: string,
        email: string
    } | null) => RTCPeerConnection;
    createOffer: (d: string | RTCPeerConnection) => Promise<RTCSessionDescriptionInit | undefined>;
    saveOfferAndCreateAnswer: (d: string | RTCPeerConnection, offer: RTCSessionDescriptionInit, senderDetails:{
        name: string,
        image: string,
        email: string
    } | null) => Promise<RTCSessionDescriptionInit | undefined>;
    saveAnswer: (socketId: string, answer: RTCSessionDescriptionInit, userDetails: {
        name: string,
        image: string,
        email: string
    } | null) => Promise<void>;
    saveIceCandidate: (socketId: string, candidate: RTCIceCandidate) => Promise<void>;
    stopStream: (socket: Socket<ServerToClientEvents, ClientToServerEvents>, type: 'audio' | 'video' | 'presentation') => void;
    clearTracks: (to: string, type: 'audio' | 'video') => void;
    removePeer: (socketId: string) => void;
    chatHistory: Chat[];
    chatUnread: boolean,
    chatVisible: boolean,
    setChatVisible: (d: boolean) => void,
    sendChat: (socket: Socket<ServerToClientEvents, ClientToServerEvents>, message: string) => void;
    receiveChat: (socketId: string, message: string) => void;
    streamsUpdatesRendered: () => void;
    userRequests: {
        socketId: string,
        user: {
            name: string,
            image: string,
            email: string
        }
    }[];
    addUserRequest: (socketId: string, user: {
        name: string,
        image: string,
        email: string
    }) => void;
    acceptUser: (socket: Socket<ServerToClientEvents, ClientToServerEvents>, roomId: string, socketId: string) => void;
    ignoreRequest: (socketId: string) => void;
}