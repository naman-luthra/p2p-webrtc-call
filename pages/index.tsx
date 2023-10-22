"use client"
import { useCallback, useState } from "react"

export default function Home() {
  const [roomId, setRoomId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const handleJoin = useCallback(async ()=>{
    setError("");
    try {
      const res = await fetch("/api/join-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomId: roomId
        })
      }).then(res=>res.json());
      if(res.roomId) window.location.href = `/room/${res.roomId}`;
      else setError("Room not found!");
    } catch (error) {
      console.log(error);
    }
  },[roomId]);

  const handleNew = useCallback(async ()=>{
    setError("");
    try {
      const res = await fetch("/api/new-room", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }).then(res=>res.json());
      if(res.roomId) window.location.href = `/room/${res.roomId}`;
      else setError("Something went wrong!");
    } catch (error) {
      console.log(error);
    }
  },[]);
  
  return (
    <main className="flex min-h-screen w-full p-8 justify-center items-center gap-4">
      <div className="grid gap-2">
        <div className="">Join a room</div>
        <input type="text" className="border border-gray-800" value={roomId} onChange={e=>setRoomId(e.target.value)}/>
        {error && <div className="text-red-500">{error}</div>}
        <button onClick={handleJoin} className="w-fit px-3 py-1 border border-gray-800 rounded-lg">Join</button>
      </div>
      <div>or</div>
      <button className="w-fit px-3 py-1 border border-gray-800 rounded-lg" onClick={handleNew}>Start a new room</button>
    </main>
  )
}
