import React, { createContext, useMemo, ReactNode, useCallback, useEffect, useState, useContext } from "react";
import { Socket, io } from "socket.io-client";
import { PeerContext } from "./PeersProvider";
import { ClientToServerEvents, ServerToClientEvents } from "./types";
import { useUser } from "./UserProvider";
export const SocketContext = createContext<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

export const SocketProvider = (props: {
    children: ReactNode;
  }) => {
    const signalingServerUri = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "http://localhost:8000";
    const socket = useMemo(()=>io(signalingServerUri),[]);

    const user = useUser();

    const peerContext = useContext(PeerContext);

    const handleCreateOffers = useCallback(async (connections: {
        sockets: string[],
        roomId: string
    }) => {
        const offers: {offer: RTCSessionDescriptionInit, to:string, senderDetails:{
            name: string,
            image: string,
            email: string
        }}[] = [];
        for(let i=0;i<connections.sockets.length;i++){
            const peer = peerContext?.createPeer(connections.sockets[i], socket, null);
            if(!peer) continue;
            const offer = await peerContext?.createOffer(peer);
            if(offer) offers.push({offer, to: connections.sockets[i], senderDetails: {
                name: user?.name || "Unknown",
                image: user?.image || "",
                email: user?.email || ""
            }});
        }
        socket.emit("offersCreated", connections.roomId, offers);
    },[peerContext, socket]);

    const handleAcceptOffer = useCallback(async (offerWithSender: {
        offer: RTCSessionDescriptionInit,
        sender: string,
        roomId: string,
        senderDetails: {
            name: string,
            image: string,
            email: string
        }
    }) => {
        const peer = peerContext?.createPeer(offerWithSender.sender, socket, offerWithSender.senderDetails);
        if(!peer) return;
        const answer = await peerContext?.saveOfferAndCreateAnswer(peer, offerWithSender.offer, offerWithSender.senderDetails);
        if(answer)
            socket.emit("answerCreated", {
                roomId: offerWithSender.roomId,
                answer,
                receiver: offerWithSender.sender,
                senderDetails: {
                    name: user?.name || "Unknown",
                    image: user?.image || "",
                    email: user?.email || ""
                }
            });
    },[peerContext, socket]);

    const handleSaveAnswer = useCallback(async (answerWithPeer: {
        answer: RTCSessionDescriptionInit,
        sender: string,
        senderDetails:{
            name: string,
            image: string,
            email: string
        }
    }) => {
        await peerContext?.saveAnswer(answerWithPeer.sender, answerWithPeer.answer, answerWithPeer.senderDetails);
    },[peerContext]);

    const handleNegoOfferAccept = useCallback(async (offerWithSender: {
        offer: RTCSessionDescriptionInit,
        sender: string
    })=>{
        const answer = await peerContext?.saveOfferAndCreateAnswer(offerWithSender.sender, offerWithSender.offer, null);
        console.log("answer", answer);
        if(answer)
            socket.emit("negoAnswerCreated", {answer, to: offerWithSender.sender});
    },[peerContext, socket]);

    const handleNegoSaveAnswer = useCallback(async (answerWithPeer: {
        answer: RTCSessionDescriptionInit,
        sender: string
    })=>{
        await peerContext?.saveAnswer(answerWithPeer.sender, answerWithPeer.answer, null);
    },[peerContext]);

    const handleSaveIceCandidate = useCallback(async (candidateWithPeer: {
        candidate: RTCIceCandidate,
        sender: string
    })=>{
        await peerContext?.saveIceCandidate(candidateWithPeer.sender, candidateWithPeer.candidate);
    },[peerContext]);

    const handleClearTracks = useCallback(async (socketId: string, type: 'audio' | 'video')=>{
        console.log("clear tracks", socketId);
        peerContext?.clearTracks(socketId, type);
    },[peerContext])

    const handleSocketDisconnect = useCallback(async (socketId: string)=>{
        peerContext?.removePeer(socketId);
    },[peerContext]);

    const handleReceiveChat = useCallback(async (messageWithSender: {sender: string, message: string})=>{
        peerContext?.receiveChat(messageWithSender.sender, messageWithSender.message);
    },[peerContext]);
    

    useEffect(() => {
        socket.on("createOffers", handleCreateOffers);
        socket.on("acceptOffer", handleAcceptOffer);
        socket.on("saveAnswer", handleSaveAnswer);
        socket.on("negoOfferAccept", handleNegoOfferAccept);
        socket.on("negoSaveAnswer", handleNegoSaveAnswer);
        socket.on("saveIceCandidate", handleSaveIceCandidate);
        socket.on("clearTracks", handleClearTracks);
        socket.on("socketDisconnected", handleSocketDisconnect);
        socket.on("receiveChat", handleReceiveChat);
    
        return () => {
            socket.off("createOffers", handleCreateOffers);
            socket.off("acceptOffer", handleAcceptOffer);
            socket.off("saveAnswer", handleSaveAnswer);
            socket.off("negoOfferAccept", handleNegoOfferAccept);
            socket.off("negoSaveAnswer", handleNegoSaveAnswer);
            socket.off("saveIceCandidate", handleSaveIceCandidate);
            socket.off("clearTracks", handleClearTracks);
            socket.off("socketDisconnected", handleSocketDisconnect);
            socket.off("receiveChat", handleReceiveChat);
        };
      }, [
        socket,
        handleCreateOffers,
        handleAcceptOffer,
        handleSaveAnswer,
        handleNegoOfferAccept,
        handleNegoSaveAnswer,
        handleSaveIceCandidate,
        handleClearTracks,
        handleSocketDisconnect
    ]);
  return (
    <SocketContext.Provider value={socket}>
        {props.children}
    </SocketContext.Provider>
  );
};