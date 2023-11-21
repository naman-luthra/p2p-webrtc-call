"use client";
import { useCallback, useState } from "react";
import { SiNextdotjs, SiWebrtc } from "react-icons/si";
import { RiP2PFill, RiVideoUploadFill } from "react-icons/ri";
import { BsGithub } from "react-icons/bs";

export default function Home() {
  const [roomId, setRoomId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const handleJoin = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/join-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: roomId,
        }),
      }).then((res) => res.json());
      if (res.roomId) window.location.href = `/room/${res.roomId}`;
      else setError("Room not found!");
    } catch (error) {
      console.log(error);
    }
  }, [roomId]);

  const handleNew = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/new-room", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());
      if (res.roomId) window.location.href = `/room/${res.roomId}`;
      else setError("Something went wrong!");
    } catch (error) {
      console.log(error);
    }
  }, []);

  return (
    <div className="min-h-screen w-full p-8 flex flex-col md:flex-row md:justify-center items-center gap-16">
        <div className="">
          <div className="">
            <div className="text-5xl font-bold">Peer to Peer HD Video Calls</div>
            <div className="text-4xl font-bold mt-1 text-gray-600">for Unmatched Privacy and Speed</div>
          </div>
          <div className="flex gap-4 py-16">
            <SiNextdotjs className="w-20 h-20" />
            <SiWebrtc className="w-20 h-20" />
            <RiP2PFill className="w-20 h-20" />
            <RiVideoUploadFill className="w-20 h-20" />
          </div>
          <div className="text-lg hidden md:block">
            <div className="font-medium">
              Enhanced by the power of WebRTC, Next.js, Websockets, and Typescript.
            </div>
            <div className="italic">
              Shaping the Future of Seamless and Secure Communication.
            </div>
          </div>
          <div className="flex mt-8 gap-2">
            <a href="https://github.com/naman-luthra/p2p-webrtc-call" className="flex gap-2 justify-center items-center w-fit p-2 bg-black text-white rounded-md hover:opacity-80">
              <BsGithub className="w-7 h-7" />
              Application
            </a>
            <a href="https://github.com/naman-luthra/signaling-server" className="flex gap-2 justify-center items-center w-fit p-2 bg-black text-white rounded-md hover:opacity-80">
              <BsGithub className="w-7 h-7" />
              Signaling Server
            </a>
          </div>
        </div>
        <div className="w-[2px] h-80 bg-black hidden md:block"/>
        <div className="flex gap-3 items-center justify-center">
          <div className="grid gap-2">
            <div className="text-2xl font-semibold">Join a room</div>
            <input
              type="text"
              className="border-2 border-gray-800 text-lg font-semibold rounded-md p-1 focus:outline-none"
              value={roomId}
              placeholder="Enter meeting id"
              onChange={(e) => setRoomId(e.target.value)}
            />
            {error && <div className="text-red-500">{error}</div>}
            <button
              onClick={handleJoin}
              className="w-fit px-3 py-1 border-2 border-gray-800 rounded-lg font-semibold hover:bg-gray-50"
            >
              Join
            </button>
          </div>
          <div className="text-lg">or</div>
          <button
            className="w-fit px-3 py-1 border-2 border-gray-800 rounded-lg text-xl hover:bg-gray-50"
            onClick={handleNew}
          >
            <span className="hidden md:inline">Start a new meeting</span>
            <span className="md:hidden">New meeting</span>
          </button>
        </div>
    </div>
  );
}
