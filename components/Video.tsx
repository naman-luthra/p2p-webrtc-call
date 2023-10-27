import Image from "next/image";
import { ReactNode } from "react";
import { FaUser } from "react-icons/fa";
import { MdFullscreen, MdFullscreenExit, MdMicOff } from "react-icons/md";

export default function Video({
  videoId,
  streaming,
  user,
  children,
  pinned,
  setPinned,
  key,
}: {
  videoId: string;
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
    <div
      key={key}
      id={`container-${videoId}`}
      className={`max-w-full max-h-full overflow-hidden justify-center items-center ${
        pinned && pinned !== videoId ? "hidden" : "flex"
      }`}
    >
      <div 
        className="overflow-hidden h-full w-full object-contain box-border relative group rounded-lg bg-white bg-opacity-20"
        >
        <video
          id={videoId}
          autoPlay
          playsInline
          preload="auto"
          controls={false}
          muted
          className="w-full h-full relative object-cover"
        />
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
                {!pinned ? (
                  <MdFullscreen
                    onClick={() => setPinned(videoId)}
                    className="h-6 w-6 hover:scale-110"
                  />
                ) : (
                  <MdFullscreenExit
                    onClick={() => setPinned("")}
                    className="h-6 w-6 hover:scale-90"
                  />
                )}
              </div>
            </div>
          }
          {children}
        </div>
      </div>
    </div>
  );
}
