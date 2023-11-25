"use client";

import Loading from "@/components/Loading";
import Room from "@/components/Room";
import Video from "@/components/Video";
import { SocketContext } from "@/context/SocketProvider";
import { useUser } from "@/context/UserProvider";
import { useRouter } from "next/router";
import { use, useCallback, useContext, useEffect, useState } from "react";
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff } from "react-icons/md";

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

  const [video, setVideo] = useState<MediaStream | null>(null);
  const [audio, setAudio] = useState<boolean>(false);

   /**
   * Handles turning on the video.
   */
   const handleVideoOn = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        setVideo(stream);
      });
  };

  /**
   * Handles turning off the video.
   */
  const handleVideoOff = () => {
    video?.getTracks().forEach((track) => track.stop());
    setVideo(null);
  };

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
    const videoRef = document.getElementById("localVideo") as HTMLAudioElement;
    if (!videoRef) return;
    else videoRef.srcObject = video;
  }
  , [video]);

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
      <main className="flex flex-col md:flex-row min-h-screen w-full p-8 justify-center items-center gap-4 bg-black text-white">
        <Video
            videoId="localVideo"
            streaming={{
              audio,
              video: !!video,
            }}
            user={{
              image: user?.image || "",
              name: user?.name || "",
            }}
            pinnable={false}
            minimisable={false}
            position="relative"
            className="w-full md:w-[640px] md:h-[360px]"
        />
        <div className="grid gap-2 justify-items-center">
          <div className="text-2xl">Join Meeting</div>
          <div className=" font-mono">{id}</div>
          {error && <div className="text-red-500">{error}</div>}
          <div className="flex gap-2">
          {video ? (
            <button
              onClick={handleVideoOff}
              className="p-2 bg-gray-700 text-gray-100 rounded-full hover:opacity-90"
            >
              <MdVideocam className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleVideoOn}
              className="p-2 bg-gray-300 text-black rounded-full hover:opacity-90"
            >
              <MdVideocamOff className="w-6 h-6" />
            </button>
          )}
          {audio ? (
            <button
              onClick={()=>setAudio(false)}
              className="p-2 bg-gray-700 text-gray-100 rounded-full hover:opacity-90"
            >
              <MdMic className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={()=>setAudio(true)}
              className="p-2 bg-gray-300 text-black rounded-full hover:opacity-90"
            >
              <MdMicOff className="w-6 h-6" />
            </button>
          )}
          </div>
          <button onClick={handleJoin} className="w-fit px-3 py-1 text-lg font-semibold bg-gray-300 text-black rounded-lg mt-2">Join</button>
        </div>
      </main>
    );
  }
  else{
    if(response.secret){
      return (
        <Room initVideo={video!==null} initAudio={audio} id={response.roomId} secret={response.secret}/>
      )
    } else{
      return <Loading text="Asking to join!"/>;
    }
  }
}
