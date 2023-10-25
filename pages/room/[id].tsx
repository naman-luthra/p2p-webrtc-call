"use client";
import { PeerContext } from "@/context/PeersProvider";
import { SocketContext } from "@/context/SocketProvider";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import { MdChat, MdMic, MdMicOff, MdSend, MdVideocam, MdVideocamOff } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { Chat } from "@/context/types";
import { useUser } from "@/context/UserProvider";
import Image from "next/image";

function ChatBar({
    chatHistory,
    handleChatSend
}: {
    chatHistory: Chat[],
    handleChatSend: (chatInput: string)=>void
}){
    const [chatInput, setChatInput] = useState<string>("");
    const handleSend = () => {
        handleChatSend(chatInput);
        setChatInput("");
    };
    return (
        <>
            <div className="h-[85vh]">
                <div className="font-semibold text-xl pt-2">Chat</div>
                <div className="pt-4 flex flex-col gap-2 overflow-y-auto text-sm">
                {
                    chatHistory.map(({message, sender, time}, id)=>(
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
                        if(e.key === 'Enter') handleSend();
                    }} value={chatInput} onChange={e=>setChatInput(e.target.value)} className="grow bg-gray-200 focus:outline-none"/>
                    <MdSend onClick={handleSend} className="w-6 h-6 hover:opacity-90"/>
                </div>
            </div>
        </>
    );
}

export default function Room({}) {
  console.log("rendered");
  const router = useRouter();
  const { id } = router.query;

  const user = useUser();

  const socket = useContext(SocketContext);
  const peerContext = useContext(PeerContext);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [video, setVideo] = useState<MediaStream | null>(null);
  const [audio, setAudio] = useState<MediaStream | null>(null);
  const [presentation, setPresentation] = useState<MediaStream | null>(null);

  const [chatVisible, setChatVisible] = useState<boolean>(false);

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

  const handleChatSend = (chatInput: string) => {
    if(!chatInput) return;
    if(!socket) return;
    peerContext?.sendChat(socket, chatInput);
  }

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("roomJoined", id as string);
    return () => {
        console.log("unmount");
      socket.emit("roomLeft", id as string);
    };
  }, [socket, id]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (presentation) videoRef.current.srcObject = presentation;
    else videoRef.current.srcObject = video;
  }, [video, presentation]);


  const [audioPlaying, setAudioPlaying] = useState<boolean[]>([]);

  useEffect(() => {
    const remoteStreams = peerContext?.peers.map(({ stream, audio, video }) => ({
        stream,
        audio,
        video
    }));
    if (!remoteStreams) return;
    let changed = false;
    remoteStreams?.forEach(({stream,audio,video}, id) => {
      const remoteVideo = document.getElementById(
        `remoteVideo${id}`
      ) as HTMLVideoElement;
      const remoteAudio = document.getElementById(
        `remoteAudio${id}`
      ) as HTMLAudioElement;
      if (remoteVideo && video.changed) {
        remoteVideo.srcObject = stream;
        changed = true;
      }
      if (remoteAudio && audio.changed) {
        remoteAudio.srcObject = stream;
        changed = true;
        if (!audioPlaying[id]) remoteAudio.pause();
        else remoteAudio.play();
      }
    });
    if(changed) peerContext?.streamsUpdatesRendered();
  }, [audioPlaying, peerContext]);

  useEffect(() => {
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
            <div className="w-full h-full absolute top-0 left-0 flex justify-center items-center text-white">
              {
                (!video && !presentation) && 
                (
                    user?.image ? (
                        <Image
                          src={user?.image.replace("s96-c", "s384-c")}
                          className="rounded-full"
                          unoptimized
                          width={144}
                          height={144}
                          alt={`${user?.name}'s Image`}
                        />
                    ) : (
                        <FaUser className="w-16 h-16" />
                    )
                )
              }
              {!audio && (
                <MdMicOff className="w-6 h-6 absolute right-2 top-2" />
              )}
                {
                    user?.name && (
                        <div className="absolute bottom-4 left-4 font-semibold">
                            {user?.name}
                        </div>
                    )
                }
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
                  <div className="h-full w-full absolute top-0 right-0 flex justify-center items-center text-white">
                    <button
                      onClick={() => {
                        setAudioPlaying((prev) => {
                          const newAudioPlaying = [...prev];
                          newAudioPlaying[id] = true;
                          return newAudioPlaying;
                        });
                      }}
                      className={`bg-sky-600 px-4 py-2 rounded-2xl text-xl font-semibold absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
                        audioPlaying[id] ? "hidden" : "block"
                      }`}
                    >
                      {"Allow Sound"}
                    </button>
                    {!peerContext.peers[id].video.playing && (
                       peerContext.peers[id].user?.image ? (
                        <Image
                          src={peerContext.peers[id].user?.image.replace("s96-c", "s384-c") || ""}
                          className="rounded-full"
                          unoptimized
                          width={144}
                          height={144}
                          alt={`${peerContext.peers[id].user?.name}'s Image`}
                        />
                        ) : (
                        <FaUser className="w-16 h-16" />
                        )
                    )}
                    {!peerContext.peers[id].audio.playing && (
                      <MdMicOff className="w-6 h-6 absolute right-2 top-2" />
                    )}
                    {
                        peerContext.peers[id]?.user?.name && (
                            <div className="absolute bottom-4 left-4 font-semibold">
                                {peerContext.peers[id]?.user?.name}
                            </div>
                        )
                    }
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
        <ChatBar chatHistory={peerContext?.chatHistory || []} handleChatSend={handleChatSend}/>
      </div>
    </div>
  );
}
