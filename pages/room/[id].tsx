"use client";
import { PeerContext } from "@/context/PeersProvider";
import { SocketContext } from "@/context/SocketProvider";
import { useRouter } from "next/router";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import {
  MdCancel,
  MdChat,
  MdChatBubble,
  MdFullscreen,
  MdFullscreenExit,
  MdMarkChatUnread,
  MdMic,
  MdMicOff,
  MdSend,
  MdVideocam,
  MdVideocamOff,
} from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { Chat } from "@/context/types";
import { useUser } from "@/context/UserProvider";
import Image from "next/image";

function ChatBar({
  chatHistory,
  handleChatSend,
  chatVisible,
  setChatVisible,
}: {
  chatHistory: Chat[];
  handleChatSend: (chatInput: string) => void;
  chatVisible: boolean;
  setChatVisible: (visible: boolean) => void;
}) {
  const [chatInput, setChatInput] = useState<string>("");
  const handleSend = () => {
    handleChatSend(chatInput);
    setTimeout(() => {
      const chatBar = document.getElementById("chatBar");
      if (chatBar != null) chatBar.scrollTop = chatBar.scrollHeight;
    }, 100);
    setChatInput("");
  };
  return (
    <>
      <div
        className="h-[85vh] relative"
        style={{ display: chatVisible ? "block" : "none" }}
      >
        <div className="flex justify-between pt-2">
          <div className="font-semibold text-xl">Chat</div>
          <MdCancel
            className="w-6 h-6 cursor-pointer hover:opacity-90"
            onClick={() => {
              setChatVisible(false);
            }}
          />
        </div>
        <div
          id="chatBar"
          className="pt-4 flex flex-col gap-2 max-h-[80vh] overflow-y-auto text-sm"
        >
          {chatHistory.map(({ message, sender, time }, id) => (
            <div key={id}>
              <div className="flex gap-1">
                <span className="font-semibold">{sender}</span>
                <span>
                  {time.toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="pl-0.5">{message}</div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="grow items-center"
        style={{ display: chatVisible ? "flex" : "none" }}
      >
        <div className="w-full flex h-10 py-1 px-2 justify-center items-center rounded-lg bg-gray-200">
          <input
            type="text"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="grow bg-gray-200 focus:outline-none"
          />
          <MdSend onClick={handleSend} className="w-6 h-6 hover:opacity-90" />
        </div>
      </div>
    </>
  );
}

function Video({
  videoId,
  audioId,
  streaming,
  user,
  children,
  pinned,
  setPinned,
  key
}: {
  videoId: string;
  audioId: string;
  streaming: {
    audio: boolean;
    video: boolean;
  };
  user: {
    image: string;
    name: string;
  };
  children?: ReactNode;
  pinned: string;
  setPinned: (pinned: string) => void;
  key?: number;
}) {
  return (
    <div key={key} className={`aspect-video max-h-full overflow-hidden relative group rounded-lg bg-white bg-opacity-20 w-full max-w-full ${(pinned && pinned!==videoId) ? 'hidden' : 'block'}`}>
      <video
        id={videoId}
        autoPlay
        muted
        className="w-full h-full relative object-cover"
      />
      <audio id={audioId} className="hidden"></audio>
      <div className="w-full h-full absolute top-0 left-0 flex justify-center items-center text-white">
        {!streaming.video &&
          (user.image ? (
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
          ))}
        {!streaming.audio && (
          <MdMicOff className="w-6 h-6 absolute right-2 top-2" />
        )}
        {user?.name && (
          <div className="absolute bottom-4 left-4 font-semibold">
            {user?.name}
          </div>
        )}
        {
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-black bg-opacity-70 p-2 rounded-lg hidden cursor-pointer group-hover:block">
            {
              !pinned ?
              <MdFullscreen onClick={()=>setPinned(videoId)} className="h-6 w-6 hover:scale-110"/> :
              <MdFullscreenExit onClick={()=>setPinned("")} className="h-6 w-6 hover:scale-90"/>
            }
            </div>
          </div>
        }
        {children}
      </div>
    </div>
  );
}

export default function Room({}) {
  console.log("rendered");
  const router = useRouter();
  const { id } = router.query;

  const user = useUser();

  const socket = useContext(SocketContext);
  const peerContext = useContext(PeerContext);

  const [video, setVideo] = useState<MediaStream | null>(null);
  const [audio, setAudio] = useState<MediaStream | null>(null);
  const [presentation, setPresentation] = useState<MediaStream | null>(null);

  const [pinned, setPinned] = useState<string>("");

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
    const audioRef = document.getElementById("localAudio") as HTMLAudioElement;
    if (audioRef) {
      audioRef.pause();
      audioRef.srcObject = null;
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
        const audioRef = document.getElementById("localAudio") as HTMLAudioElement;
        if (audioRef) {
          audioRef.srcObject = stream;
          audioRef.play();
        }
        handleAudioOff();
        handleVideoOff();
        peerContext?.sendStream(stream);
      });
  };

  const handleChatSend = (chatInput: string) => {
    if (!chatInput) return;
    if (!socket) return;
    peerContext?.sendChat(socket, chatInput);
  };

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("roomJoined", id as string);
    return () => {
      console.log("unmount");
      socket.emit("roomLeft", id as string);
    };
  }, [socket, id]);

  useEffect(() => {
    const videoRef = document.getElementById("localVideo") as HTMLAudioElement;
    if (!videoRef) return;
    if (presentation) videoRef.srcObject = presentation;
    else videoRef.srcObject = video;
  }, [video, presentation]);

  const [audioPlaying, setAudioPlaying] = useState<boolean[]>([]);

  useEffect(() => {
    const remoteStreams = peerContext?.peers.map(
      ({ stream, audio, video }) => ({
        stream,
        audio,
        video,
      })
    );
    if (!remoteStreams) return;
    let changed = false;
    remoteStreams?.forEach(({ stream, audio, video }, id) => {
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
    if (changed) peerContext?.streamsUpdatesRendered();
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

  const chatHistory = peerContext?.chatHistory;
  useEffect(() => {
    if (chatHistory?.length) {
      if (chatHistory[chatHistory.length - 1].sender !== "You") {
        const messageAudio = new Audio("/message.mp3");
        messageAudio.play();
      }
    }
  }, [chatHistory]);

  console.log(peerContext?.peers);

  return (
    <div className="w-full h-screen flex">
      <div className="grow h-full p-4 flex flex-col gap-4 bg-black opacity-95">
        <div
          className="grid place-items-center w-full gap-4 h-[85vh] relative"
          style={{
            gridTemplateColumns: `repeat(${
              !peerContext?.peers.length || pinned
                ? 1
                : peerContext?.peers.length < 4
                ? 2
                : 3
            }, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${
              !peerContext?.peers.length || pinned
                ? 1
                : peerContext?.peers.length < 2
                ? 1
                : 2
            }, minmax(0, 1fr))`,
          }}
        >
          <Video
            videoId="localVideo"
            audioId="localAudio"
            streaming={{
              audio: !!audio,
              video: !!video,
            }}
            user={{
              image: user?.image || "",
              name: user?.name || "",
            }}
            pinned={pinned}
            setPinned={setPinned}
          />
          {peerContext?.peers.map(({ audio, video, user }, id) => (
            <Video
              videoId={`remoteVideo${id}`}
              audioId={`remoteVideo${id}`}
              streaming={{
                audio: audio.playing,
                video: video.playing,
              }}
              user={{
                image: user?.image || "",
                name: user?.name || "",
              }}
              pinned={pinned}
              setPinned={setPinned}
              key={id}
            >
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
            </Video>
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
            onClick={() => peerContext?.setChatVisible(!peerContext?.chatVisible)}
            className="p-2 bg-gray-300 rounded-y-full rounded-l-full ml-auto absolute -right-4 top-1/2 -translate-y-1/2"
          >
            {peerContext?.chatUnread ? (
              <MdMarkChatUnread className="w-6 h-6" />
            ) : (
              <MdChatBubble className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
      <div
        className={`bg-gray-300 relative transition-all duration-200 flex flex-col gap-4 overflow-hidden ${
          peerContext?.chatVisible ? "w-96 p-4" : "w-0"
        }`}
      >
        <ChatBar
          chatVisible={peerContext?.chatVisible || false}
          setChatVisible={peerContext?.setChatVisible || (() => {})}
          chatHistory={peerContext?.chatHistory || []}
          handleChatSend={handleChatSend}
        />
      </div>
    </div>
  );
}
