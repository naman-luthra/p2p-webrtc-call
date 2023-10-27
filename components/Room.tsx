import { PeerContext } from "@/context/PeersProvider";
import { SocketContext } from "@/context/SocketProvider";
import { useContext, useEffect, useRef, useState } from "react";
import {
  MdChatBubble,
  MdMarkChatUnread,
  MdMic,
  MdMicOff,
  MdVideocam,
  MdVideocamOff,
} from "react-icons/md";
import { useUser } from "@/context/UserProvider";
import Video from "@/components/Video";
import ChatBar from "@/components/ChatBar";
import Image from "next/image";

export default function Room({ id, secret }: { id: string; secret: string }) {
  console.log("rendered");
  const user = useUser();

  const socket = useContext(SocketContext);
  const peerContext = useContext(PeerContext);

  const [video, setVideo] = useState<MediaStream | null>(null);
  const [audio, setAudio] = useState<MediaStream | null>(null);
  const [presentation, setPresentation] = useState<MediaStream | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

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
        const audioRef = document.getElementById(
          "localAudio"
        ) as HTMLAudioElement;
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
  const handleUserAccept = (socketId: string) => {
    if (!socket) return;
    peerContext?.acceptUser(socket, id, socketId);
  }
  const handleIgnoreRequest = (socketId: string) => {
    if (!socket) return;
    peerContext?.ignoreRequest(socketId);
  }

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("roomJoined", id, secret);
    return () => {
      console.log("unmount");
      socket.emit("roomLeft", id);
    };
  }, [socket, id, secret]);

  useEffect(() => {
    const videoRef = document.getElementById("localVideo") as HTMLAudioElement;
    if (!videoRef) return;
    if (presentation) videoRef.srcObject = presentation;
    else videoRef.srcObject = video;
  }, [video, presentation]);

  useEffect(() => {
    const remoteStreams = peerContext?.peers.map(
      ({ stream, audio, video }) => ({
        stream,
        audio,
        video
      })
    );
    if (!remoteStreams) return;
    let changed = false;
    remoteStreams?.forEach(({ stream, video }, id) => {
      const remoteVideo = document.getElementById(
        `remoteVideo${id}`
      ) as HTMLVideoElement;
      if (remoteVideo && video.changed) {
        remoteVideo.srcObject = stream;
        changed = true;
      }
    });
    if(remoteStreams.find(({audio})=>audio.changed)){
        if(audioRef.current && peerContext?.audioStream){
            audioRef.current.srcObject = peerContext.audioStream;
            audioRef.current.play();
        }
        changed = true;
    }
    if (changed) peerContext?.streamsUpdatesRendered();
  }, [peerContext]);

  const chatHistory = peerContext?.chatHistory;
  useEffect(() => {
    if (chatHistory?.length) {
      if (chatHistory[chatHistory.length - 1].sender !== "You") {
        const messageAudio = new Audio("/message.mp3");
        messageAudio.play();
      }
    }
  }, [chatHistory]);

  const userRequests = peerContext?.userRequests;
    useEffect(() => {
        if (userRequests?.length) {
        const messageAudio = new Audio("/request.mp3");
        messageAudio.play();
        }
    }, [userRequests]);

  const numberOfStreams = (peerContext?.peers.length || 0) + 1;

  return (
    <div className="w-full h-screen flex">
      <div className="grow h-full p-4 flex flex-col gap-4 bg-black opacity-95 relative">
        <div
          className={`grid justify-center place-content-stretch w-full gap-4 h-[85vh] relative ${
            (numberOfStreams === 1 || pinned)
              ? "grid-cols-1"
              : numberOfStreams <= 4
              ? "md:grid-cols-2"
              : "md:grid-cols-3"
          }`}
        >
          <audio id="audioPlayer" ref={audioRef} className="hidden"/>
          <Video
            videoId="localVideo"
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
            onClick={() =>
              peerContext?.setChatVisible(!peerContext?.chatVisible)
            }
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
      <div className="grid gap-2 absolute bottom-4 right-4">
      {
        userRequests?.map(({ user, socketId }, id) => (
            <div key={id} className="bg-white p-4 rounded-lg">
                <div className="flex gap-2 justify-center items-center">
                    <Image src={user.image} alt={`${user.name}'s picture`} unoptimized width={48} height={48} className="rounded-full"/>
                    <div>
                        <div className="font-semibold text-sm">{user.name}</div>
                        <div className="text-xs">{user.email}</div>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={()=>handleUserAccept(socketId)} className="hover:opacity-90">Accept</button>
                    <button onClick={()=>handleIgnoreRequest(socketId)} className="hover:opacity-90">Ignore</button>
                </div>
            </div>
        ))
      }
      </div>
    </div>
  );
}
