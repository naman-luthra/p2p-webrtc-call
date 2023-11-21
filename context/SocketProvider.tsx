import React, {
  createContext,
  useMemo,
  ReactNode,
  useCallback,
  useEffect,
  useContext,
} from "react";
import { Socket, io } from "socket.io-client";
import { PeerContext } from "./PeersProvider";
import { ClientToServerEvents, ServerToClientEvents } from "./types";
import { useUser } from "./UserProvider";

// The Socket context.
export const SocketContext = createContext<Socket<
  ServerToClientEvents,
  ClientToServerEvents
> | null>(null);

/**
 * Provides the Socket context for the application.
 * @remarks
 * This component creates a Socket.IO client and manages various socket events and callbacks.
 * @param props - The component props.
 * @param props.children - The child components.
 * @returns The SocketProvider component.
 */
export const SocketProvider = (props: { children: ReactNode }) => {
  // The signaling server URI.
  const signalingServerUri =
    process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "http://localhost:8000";
  
  // The socket instance.
  const socket = useMemo(() => io(signalingServerUri), []);

  // The user details object.
  const user = useUser();

  // The Peer context.
  const peerContext = useContext(PeerContext);

  // Function to handle the creation of offers on joing a room
  const handleCreateOffers = useCallback(
    async (connections: { sockets: string[]; roomId: string }) => {
      const offers: {
        offer: RTCSessionDescriptionInit;
        to: string;
        senderDetails: {
          name: string;
          image: string;
          email: string;
        };
      }[] = [];
      for (let i = 0; i < connections.sockets.length; i++) {
        const peer = peerContext?.createPeer(
          connections.sockets[i],
          socket,
          null
        );
        if (!peer) continue;
        const offer = await peerContext?.createOffer(peer);
        if (offer)
          offers.push({
            offer,
            to: connections.sockets[i],
            senderDetails: {
              name: user?.name || "Unknown",
              image: user?.image || "",
              email: user?.email || "",
            },
          });
      }
      socket.emit("offersCreated", connections.roomId, offers);
    },
    [peerContext, socket]
  );

  // Function to handle the acceptance of an offer from another peer
  const handleAcceptOffer = useCallback(
    async (offerWithSender: {
      offer: RTCSessionDescriptionInit;
      sender: string;
      roomId: string;
      senderDetails: {
        name: string;
        image: string;
        email: string;
      };
    }) => {
      const peer = peerContext?.createPeer(
        offerWithSender.sender,
        socket,
        offerWithSender.senderDetails
      );
      if (!peer) return;
      const answer = await peerContext?.saveOfferAndCreateAnswer(
        peer,
        offerWithSender.offer,
        offerWithSender.senderDetails
      );
      if (answer)
        socket.emit("answerCreated", {
          roomId: offerWithSender.roomId,
          answer,
          receiver: offerWithSender.sender,
          senderDetails: {
            name: user?.name || "Unknown",
            image: user?.image || "",
            email: user?.email || "",
          },
        });
    },
    [peerContext, socket]
  );

  // Function to handle the saving of an answer from another peer
  const handleSaveAnswer = useCallback(
    async (answerWithPeer: {
      answer: RTCSessionDescriptionInit;
      sender: string;
      senderDetails: {
        name: string;
        image: string;
        email: string;
      };
    }) => {
      await peerContext?.saveAnswer(
        answerWithPeer.sender,
        answerWithPeer.answer,
        answerWithPeer.senderDetails
      );
    },
    [peerContext]
  );

  // Function to handle the acceptance of an negotiation offer from another peer
  const handleNegoOfferAccept = useCallback(
    async (offerWithSender: {
      offer: RTCSessionDescriptionInit;
      sender: string;
    }) => {
      const answer = await peerContext?.saveOfferAndCreateAnswer(
        offerWithSender.sender,
        offerWithSender.offer,
        null
      );
      if (answer)
        socket.emit("negoAnswerCreated", {
          answer,
          to: offerWithSender.sender,
        });
    },
    [peerContext, socket]
  );

  // Function to handle the saving of an negotiation answer from another peer
  const handleNegoSaveAnswer = useCallback(
    async (answerWithPeer: {
      answer: RTCSessionDescriptionInit;
      sender: string;
    }) => {
      await peerContext?.saveAnswer(
        answerWithPeer.sender,
        answerWithPeer.answer,
        null
      );
    },
    [peerContext]
  );

  // Function to handle the saving of an ICE candidate from another peer
  const handleSaveIceCandidate = useCallback(
    async (candidateWithPeer: {
      candidate: RTCIceCandidate;
      sender: string;
    }) => {
      await peerContext?.saveIceCandidate(
        candidateWithPeer.sender,
        candidateWithPeer.candidate
      );
    },
    [peerContext]
  );

  // Function to handle the clearing of tracks received from another peer
  const handleClearTracks = useCallback(
    async (socketId: string, type: "audio" | "video") => {
      peerContext?.clearTracks(socketId, type);
    },
    [peerContext]
  );

  // Function to handle the disconnection of a peer
  const handleSocketDisconnect = useCallback(
    async (socketId: string) => {
      peerContext?.removePeer(socketId);
    },
    [peerContext]
  );

  // Function to handle the receiving of a chat message from another peer
  const handleReceiveChat = useCallback(
    async (messageWithSender: { sender: string; message: string }) => {
      peerContext?.receiveChat(
        messageWithSender.sender,
        messageWithSender.message
      );
    },
    [peerContext]
  );

  // Function to handle the receiving of a user request to join a room
  const handleUserRequestJoinRoom = useCallback(
    async ({
      socketId,
      user
    }: {
      socketId: string;
      user: {
        name: string;
        image: string;
        email: string;
      };
    }) => {
        peerContext?.addUserRequest(socketId, user);
    },
    [peerContext]
  );

  // Add socket event listeners
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
    socket.on("userRequestJoinRoom", handleUserRequestJoinRoom);

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
      socket.off("userRequestJoinRoom", handleUserRequestJoinRoom);
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
    handleSocketDisconnect,
  ]);
  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
