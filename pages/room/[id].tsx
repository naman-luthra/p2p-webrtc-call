"use client";

import Room from "@/components/Room";
import { SocketContext } from "@/context/SocketProvider";
import { useUser } from "@/context/UserProvider";
import { useRouter } from "next/router";
import { useCallback, useContext, useEffect, useState } from "react";

export default function RoomView() {
  const router = useRouter();
  const { id } = router.query;
  const [ error, setError ] = useState<string>("");
  const [ response, setResponse ] = useState<{
    roomId: string,
    secret: string
  } | null>(null);
  const handleJoin = useCallback(async ()=>{
    try {
      const res = await fetch("/api/join-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomId: id
        })
      }).then(res=>res.json());
      if(res.roomId) setResponse(res);
      else{
        setError(res.error);
      }
    } catch (err) {
      setError("Room not found!");
    }
  },[id]);
  const socket = useContext(SocketContext);
  const user = useUser();

  const handleJoinRequestAccepted = useCallback((roomId: string, secret: string)=>{
    console.log("Join request accepted");
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

  if(!response)
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
  else{
    if(response.secret){
      return (
        <Room id={response.roomId} secret={response.secret}/>
      )
    } else{
      return (
        <div>Joining...</div>
      )
    }
  }
}
