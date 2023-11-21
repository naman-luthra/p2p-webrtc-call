"use client";

import Loading from "@/components/Loading";
import Room from "@/components/Room";
import { SocketContext } from "@/context/SocketProvider";
import { useUser } from "@/context/UserProvider";
import { useRouter } from "next/router";
import { useCallback, useContext, useEffect, useState } from "react";

/**
 * Renders the RoomView component.
 * 
 * @returns The JSX element representing the RoomView component.
 */
export default function RoomView() {
  
  const router = useRouter();
  const { id } = router.query;
  const [ error, setError ] = useState<string>("");
  const [ response, setResponse ] = useState<{
    roomId: string,
    secret: string
  } | null>(null);
  const socket = useContext(SocketContext);
  const user = useUser();

  /**
   * Handles the join room functionality.
   * Makes a POST request to the "/api/join-room" endpoint with the roomId.
   * Sets the response if the roomId is returned, otherwise sets the error.
   * If an error occurs during the request, sets the error message to "Room not found!".
   */
  const handleJoin = useCallback(async () => {
    try {
      const res = await fetch("/api/join-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomId: id
        })
      }).then(res => res.json());
      if (res.roomId) setResponse(res);
      else {
        setError(res.error);
      }
    } catch (err) {
      setError("Room not found!");
    }
  }, [id]);

  /**
   * Handles the acceptance of a join request.
   * 
   * @param {string} roomId - The ID of the room.
   * @param {string} secret - The secret for the room.
   */
  const handleJoinRequestAccepted = useCallback((roomId: string, secret: string)=>{
    if(roomId === id){
      setResponse({
        roomId,
        secret
      });
    }
  },[id]);

  useEffect(()=>{
    if((socket && user) && (response?.roomId && !response?.secret)){
      socket?.emit("requestJoinRoom",
        response.roomId,
        user
      );
    }
  },[response, socket, user])

  useEffect(()=>{
    socket?.on("joinRequestAccepted", handleJoinRequestAccepted);
    return ()=>{
      socket?.off("joinRequestAccepted", handleJoinRequestAccepted);
    }
  },[
    socket,
    handleJoinRequestAccepted
  ]);

  if(!response){
    return (
      <main className="flex min-h-screen w-full p-8 justify-center items-center gap-4">
        <div className="grid gap-2">
          <div className="">Join Meeting</div>
          <div>{id}</div>
          {error && <div className="text-red-500">{error}</div>}
          <button onClick={handleJoin} className="w-fit px-3 py-1 border border-gray-800 rounded-lg">Join</button>
        </div>
      </main>
    );
  }
  else{
    if(response.secret){
      return (
        <Room id={response.roomId} secret={response.secret}/>
      )
    } else{
      return <Loading />;
    }
  }
}
