import { PeerContext } from "@/context/PeersProvider";
import { SocketContext } from "@/context/SocketProvider";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  MdCallEnd,
  MdChatBubble,
  MdMarkChatUnread,
  MdMic,
  MdMicOff,
  MdOutlinePresentToAll,
  MdPausePresentation,
  MdVideocam,
  MdVideocamOff,
} from "react-icons/md";
import { useUser } from "@/context/UserProvider";
import Video from "@/components/Video";
import ChatBar from "@/components/ChatBar";
import Image from "next/image";
import createLayout from "@/utils/layout";
import { redirect } from "next/navigation";
import { useRouter } from "next/router";

/**
 * Room component represents a video call room.
 * @param id - The ID of the room.
 * @param secret - The secret key of the room.
 */
export default function Room({ id, secret, initVideo, initAudio }: { 
  id: string; 
  secret: string;
  initVideo?: boolean;
  initAudio?: boolean;
}) {
  const user = useUser();

  const socket = useContext(SocketContext);
  const peerContext = useContext(PeerContext);

  const [video, setVideo] = useState<MediaStream | null>(null);
  const [audio, setAudio] = useState<MediaStream | null>(null);
  const [presentation, setPresentation] = useState<MediaStream | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const [pinned, setPinned] = useState<string>("");
  const [minimised, setActMinimised] = useState<boolean>(false);

  /**
   * Sets the minimised state of the room.
   * @param minimised - Whether the room is minimised or not.
   */
  const setMinimised = (minimised: boolean) => {
    setActMinimised(minimised);
    if (minimised) {
      const localVideoContainer = document.getElementById(
        "container-localVideo"
      );
      if (localVideoContainer) {
        localVideoContainer.style.width = "256px";
        localVideoContainer.style.height = "144px";
        localVideoContainer.style.top = "auto";
        localVideoContainer.style.left = "auto";
        localVideoContainer.style.bottom = "16px";
        localVideoContainer.style.right = "16px";
      }
      setPinned("");
    }
  };

  /**
   * Handles turning on the video.
   */
  const handleVideoOn = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        setVideo(stream);
        peerContext?.sendStream(stream);
      });
  };

  /**
   * Handles turning off the video.
   */
  const handleVideoOff = () => {
    video?.getTracks().forEach((track) => track.stop());
    if (socket) peerContext?.stopStream(socket, "video");
    setVideo(null);
  };

  /**
   * Handles turning on the audio.
   */
  const handleAudioOn = () => {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream) => {
        setAudio(stream);
        peerContext?.sendStream(stream);
      });
  };

  /**
   * Handles turning off the audio.
   */
  const handleAudioOff = () => {
    audio?.getTracks().forEach((track) => track.stop());
    if (socket) peerContext?.stopStream(socket, "audio");
    setAudio(null);
  };

  /**
   * Handles turning off the presentation.
   */
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

  /**
   * Handles turning on the presentation.
   */
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

  /**
   * Handles sending a chat message.
   * @param chatInput - The input message.
   */
  const handleChatSend = (chatInput: string) => {
    if (!chatInput) return;
    if (!socket) return;
    peerContext?.sendChat(socket, chatInput);
  };

  /**
   * Handles accepting a user request.
   * @param socketId - The ID of the socket.
   */
  const handleUserAccept = (socketId: string) => {
    if (!socket) return;
    peerContext?.acceptUser(socket, id, socketId);
  };

  /**
   * Handles ignoring a user request.
   * @param socketId - The ID of the socket.
   */
  const handleIgnoreRequest = (socketId: string) => {
    if (!socket) return;
    peerContext?.ignoreRequest(socketId);
  };

  useEffect(() => {
    if (!socket || !id) return;
    if(initVideo) handleVideoOn();
    if(initAudio) handleAudioOn();
    socket.emit("roomJoined", id, secret);
    return () => {
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
        video,
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
    if (remoteStreams.find(({ audio }) => audio.changed)) {
      if (audioRef.current && peerContext?.audioStream) {
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

  const numberOfStreams = pinned
    ? 1
    : (peerContext?.peers.length || 0) + 1 - (minimised ? 1 : 0);

  /**
   * Handles the layout of video elements in the room.
   * This function calculates the coordinates and sizes of video elements based on the container size and number of streams.
   * It then applies the calculated layout to the video elements.
   */
  const handleLayout = useCallback(() => {
    const videoGrid = document.getElementById("videoGrid");
    if (!videoGrid) return;
    const containerWidth = videoGrid.clientWidth;
    const containerHeight = videoGrid.clientHeight;

    const layout = createLayout(
      numberOfStreams,
      containerWidth,
      containerHeight
    );
    layout.coordinates.forEach(({ top, left }, id) => {
      let videoElement: HTMLElement | null = null;
      if (id == 0 && !minimised) {
        videoElement = pinned
          ? document.getElementById(`container-${pinned}`)
          : document.getElementById("container-localVideo");
      } else
        videoElement = pinned
          ? document.getElementById(`container-${pinned}`)
          : document.getElementById(
              `container-remoteVideo${minimised ? id : id - 1}`
            );
      if (videoElement) {
        videoElement.style.top = `${top}px`;
        videoElement.style.bottom = "auto";
        videoElement.style.left = `${left}px`;
        videoElement.style.right = "auto";
        videoElement.style.width = `${layout.elementWidth}px`;
        videoElement.style.height = `${layout.elementHeight}px`;
      }
    });
  }, [numberOfStreams, minimised]);
  useEffect(() => {
    handleLayout();
    const videoGrid = document.getElementById("videoGrid");
    if(videoGrid)
        new ResizeObserver(handleLayout).observe(videoGrid);
  }, [numberOfStreams, minimised]);

  const router = useRouter();

  return (
    <div className="absolute inset-0 flex">
      <div className="grow h-full p-2 flex flex-col bg-black opacity-95 relative">
        <div id="videoGrid" className="w-full grow relative">
          <audio id="audioPlayer" ref={audioRef} className="hidden" />
          <Video
            videoId="localVideo"
            streaming={{
              audio: !!audio,
              video: !!video || !!presentation,
            }}
            user={{
              image: user?.image || "",
              name: user?.name || "",
            }}
            pinnable
            pinned={pinned}
            setPinned={setPinned}
            minimisable={true}
            minimised={minimised}
            setMinimised={setMinimised}
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
              pinnable
              pinned={pinned}
              setPinned={setPinned}
              key={id}
              minimisable={false}
            ></Video>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 p-2 relative">
          {
            !presentation && (
              <>
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
              </>
            )
          }
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
              <MdPausePresentation className="w-6 h-6"/>
            </button>
          ) : (
            <button
              onClick={handlePresentationOn}
              className="p-2 bg-gray-300 rounded-full hover:opacity-90"
            >
              <MdOutlinePresentToAll className="w-6 h-6"/>
            </button>
          )}
          <button
              onClick={()=>{
                socket?.disconnect();
                router.push("/");
              }}
              className="p-2 bg-gray-300 rounded-full hover:opacity-90"
            >
              <MdCallEnd className="w-6 h-6"/>
            </button>
          <button
            onClick={() =>
              peerContext?.setChatVisible(!peerContext?.chatVisible)
            }
            className="p-2 bg-gray-300 rounded-y-full rounded-l-full ml-auto absolute -right-2 top-1/2 -translate-y-1/2"
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
        className={`bg-gray-300 transition-all duration-200 flex flex-col overflow-hidden ${
          peerContext?.chatVisible ? "w-full absolute inset-0 md:w-96 md:relative p-4" : "hidden md:flex md:w-0"
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
        {userRequests?.map(({ user, socketId }, id) => (
          <div key={id} className="bg-white p-4 rounded-lg">
            <div className="flex gap-2 justify-center items-center">
              <Image
                src={user.image}
                alt={`${user.name}'s picture`}
                unoptimized
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <div className="font-semibold text-sm">{user.name}</div>
                <div className="text-xs">{user.email}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleUserAccept(socketId)}
                className="hover:opacity-90"
              >
                Accept
              </button>
              <button
                onClick={() => handleIgnoreRequest(socketId)}
                className="hover:opacity-90"
              >
                Ignore
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
