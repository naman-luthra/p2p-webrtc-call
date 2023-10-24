"use client";
import { PeerContext } from "@/context/PeersProvider";
import { SocketContext } from "@/context/SocketProvider";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import { MdChat, MdMic, MdMicOff, MdSend, MdVideocam, MdVideocamOff } from "react-icons/md";
import { FaUser } from "react-icons/fa";

export default function Room({}) {
  console.log("rendered");
  const router = useRouter();
  const { id } = router.query;

  const socket = useContext(SocketContext);
  const peerContext = useContext(PeerContext);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [video, setVideo] = useState<MediaStream | null>(null);
  const [audio, setAudio] = useState<MediaStream | null>(null);
  const [presentation, setPresentation] = useState<MediaStream | null>(null);

  const [chatVisible, setChatVisible] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");

  const handleVideoOn = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        setVideo(stream);
        peerContext?.sendStream(stream);
      });
  };
  const handleVideoOff = () => {
    video?.getTracks().forEach((track) => track.stop());
    if (socket) peerContext?.stopStream(socket, "video");
    setVideo(null);
  };
  const handleAudioOn = () => {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream) => {
        setAudio(stream);
        peerContext?.sendStream(stream);
      });
  };
  const handleAudioOff = () => {
    audio?.getTracks().forEach((track) => track.stop());
    if (socket) peerContext?.stopStream(socket, "audio");
    setAudio(null);
  };
  const handlePresentationOff = () => {
    presentation?.getTracks().forEach((track) => track.stop());
    if (socket) peerContext?.stopStream(socket, "presentation");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
    setPresentation(null);
  };

  const handlePresentationOn = () => {
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        setPresentation(stream);
        stream.getTracks().forEach((track) => {
          if (track.kind === "video") {
            track.addEventListener("ended", handlePresentationOff);
          }
        });
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
          audioRef.current.play();
        }
        handleAudioOff();
        handleVideoOff();
        peerContext?.sendStream(stream);
      });
  };

  const handleChatSend = () => {
    if(!chatInput) return;
    if(!socket) return;
    peerContext?.sendChat(socket, chatInput);
    setChatInput("");
  }

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("roomJoined", id as string);
    return () => {
      socket.emit("roomLeft", id as string);
    };
  }, [socket, id]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (presentation) videoRef.current.srcObject = presentation;
    else videoRef.current.srcObject = video;
  }, [video, presentation]);

  const remoteStreams = peerContext?.peers.map(({ stream }) => stream);

  const [audioPlaying, setAudioPlaying] = useState<boolean[]>([]);

  useEffect(() => {
    if (!remoteStreams) return;
    remoteStreams?.forEach((stream, id) => {
      const remoteVideo = document.getElementById(
        `remoteVideo${id}`
      ) as HTMLVideoElement;
      const remoteAudio = document.getElementById(
        `remoteAudio${id}`
      ) as HTMLAudioElement;
      if (remoteVideo) {
        remoteVideo.srcObject = stream;
      }
      if (remoteAudio) {
        remoteAudio.srcObject = stream;
        if (!audioPlaying[id]) remoteAudio.pause();
        else remoteAudio.play();
      }
    });
    return () => {
      remoteStreams?.forEach((_, id) => {
        const remoteVideo = document.getElementById(
          `remoteVideo${id}`
        ) as HTMLVideoElement;
        const remoteAudio = document.getElementById(
          `remoteAudio${id}`
        ) as HTMLAudioElement;
        if (remoteVideo) {
          remoteVideo.srcObject = null;
        }
        if (remoteAudio) {
          remoteAudio.srcObject = null;
        }
      });
    };
  }, [remoteStreams, audioPlaying]);

  useEffect(() => {
    console.log("audio playing", audioPlaying);
    audioPlaying.forEach((playing, id) => {
      const remoteAudio = document.getElementById(
        `remoteAudio${id}`
      ) as HTMLAudioElement;
      if (remoteAudio) {
        if (playing) {
          if (remoteAudio.paused) remoteAudio.play();
        } else {
          if (!remoteAudio.paused) remoteAudio.pause();
        }
      }
    });
  }, [audioPlaying]);

  console.log(peerContext?.peers);

  return (
    <div className="w-full h-screen flex">
      <div className="grow h-full p-4 flex flex-col gap-4 bg-black opacity-95">
        <div
          className="grid w-full gap-4 h-[85vh]"
          style={{
            gridTemplateColumns: `repeat(${
              !peerContext?.peers.length
                ? 1
                : peerContext?.peers.length < 4
                ? 2
                : 3
            }, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${
              !peerContext?.peers.length
                ? 1
                : peerContext?.peers.length < 2
                ? 1
                : 2
            }, minmax(0, 1fr))`,
          }}
        >
          <div className="w-full h-full relative group rounded-lg bg-white bg-opacity-20">
            <video
              id="localVideo"
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full relative"
            />
            <audio id="localAudio" ref={audioRef} className="hidden"></audio>
            <div className="w-full h-full absolute top-0 left-0 flex justify-center items-center">
              {!video && !presentation && <FaUser className="w-16 h-16" />}
              {!audio && (
                <MdMicOff className="w-6 h-6 absolute right-2 top-2" />
              )}
            </div>
          </div>
          {peerContext?.peers.map(({ stream }, id) => (
            <div
              key={id}
              className="w-full h-full relative group rounded-lg bg-white bg-opacity-20"
            >
              {stream && (
                <>
                  <audio id={`remoteAudio${id}`} className="hidden"></audio>
                  <video
                    id={`remoteVideo${id}`}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full"
                  ></video>
                  <div className="h-full w-full absolute top-0 right-0 flex justify-center items-center">
                    <button
                      onClick={() => {
                        setAudioPlaying((prev) => {
                          const newAudioPlaying = [...prev];
                          newAudioPlaying[id] = true;
                          return newAudioPlaying;
                        });
                      }}
                      className={`bg-sky-600 px-4 py-2 rounded-2xl text-white text-xl font-semibold absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
                        audioPlaying[id] ? "hidden" : "block"
                      }`}
                    >
                      {"Allow Sound"}
                    </button>
                    {!peerContext.peers[id].video && (
                      <FaUser className="w-16 h-16" />
                    )}
                    {!peerContext.peers[id].audio && (
                      <MdMicOff className="w-6 h-6 absolute right-2 top-2" />
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="grow flex items-center justify-center gap-4 relative">
          {video ? (
            <button
              onClick={handleVideoOff}
              className="p-2 bg-gray-700 text-gray-100  rounded-full hover:opacity-90"
            >
              <MdVideocam className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleVideoOn}
              className="p-2 bg-gray-300 rounded-full hover:opacity-90"
            >
              <MdVideocamOff className="w-6 h-6" />
            </button>
          )}
          {audio ? (
            <button
              onClick={handleAudioOff}
              className="p-2 bg-gray-700 text-gray-100 rounded-full hover:opacity-90"
            >
              <MdMic className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleAudioOn}
              className="p-2 bg-gray-300 rounded-full hover:opacity-90"
            >
              <MdMicOff className="w-6 h-6" />
            </button>
          )}
          {presentation ? (
            <button
              onClick={handlePresentationOff}
              className="p-2 bg-gray-700 text-gray-100 rounded-full hover:opacity-90"
            >
              Stop Presentation
            </button>
          ) : (
            <button
              onClick={handlePresentationOn}
              className="p-2 bg-gray-300 rounded-full hover:opacity-90"
            >
              Start Presentation
            </button>
          )}
          <button
                onClick={() => setChatVisible((prev) => !prev)}
                className="p-2 bg-gray-300 rounded-y-full rounded-l-full ml-auto pr-4 absolute -right-4 top-1/2 -translate-y-1/2"
            >
                <MdChat className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className={`bg-gray-300 relative transition-all duration-100 p-4 flex flex-col gap-4 w-96 ${chatVisible ? 'block' : 'hidden'}`}>
        <div className="h-[85vh]">
            <div className="font-semibold text-xl pt-2">Chat</div>
            <div className="pt-4 flex flex-col gap-2 overflow-y-auto text-sm">
            {
                peerContext?.chatHistory.map(({message, sender, time}, id)=>(
                    <div key={id}>
                        <div className="flex gap-1">
                        <span className="font-semibold">{sender}</span>
                        <span>{time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="pl-0.5">{message}</div>
                    </div>
                ))
            }
            </div>
        </div>
        <div className="grow flex items-center">
            <div className="w-full flex h-10 py-1 px-2 justify-center items-center rounded-lg bg-gray-200">
                <input type="text" onKeyDown={e=>{
                    if(e.key === 'Enter') handleChatSend();
                }} value={chatInput} onChange={e=>setChatInput(e.target.value)} className="grow bg-gray-200 focus:outline-none"/>
                <MdSend onClick={handleChatSend} className="w-6 h-6 hover:opacity-90"/>
            </div>
        </div>
      </div>
    </div>
  );
}
