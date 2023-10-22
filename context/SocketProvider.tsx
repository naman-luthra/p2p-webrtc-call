import React, { createContext, useMemo, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface ServerToClientEvents {
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
}

interface ClientToServerEvents {
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
}

export const SocketContext = createContext<Socket<ServerToClientEvents, ClientToServerEvents>| null>(null);

export const SocketProvider = (props: {
    children: ReactNode;
  }) => {
    const signalingServerUri = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "http://localhost:8000";
    const socket = useMemo(() => io(signalingServerUri), []);
  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};