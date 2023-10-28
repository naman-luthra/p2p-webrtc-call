import Image from "next/image";
import { ReactNode } from "react";
import { FaUser } from "react-icons/fa";
import { MdFullscreen, MdFullscreenExit, MdMicOff } from "react-icons/md";
import { TbWindowMaximize, TbWindowMinimize } from "react-icons/tb";

export default function Video({
  videoId,
  streaming,
  user,
  children,
  pinned,
  setPinned,
  minimisable,
  minimised,
  setMinimised,
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
  minimisable: boolean;
  minimised?: boolean;
  setMinimised?: (minimised: boolean) => void;
}) {

  return (
    <div
      id={`container-${videoId}`}
      className={
        minimisable && minimised
          ? "absolute bottom-2 right-2 w-64 h-36 z-20"
          : `max-w-full max-h-full overflow-hidden justify-center items-center ${
              pinned && pinned !== videoId ? "hidden" : "flex"
            }`
      }
      draggable={minimisable && minimised}
    >
      <div className={`overflow-hidden h-full w-full object-contain box-border relative group rounded-lg ${(minimisable && minimised) ? 'bg-[#212121]' : 'bg-[#3d3d3d]'}`}>
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
                width={(minimisable && minimised) ? 64 : 144}
                height={(minimisable && minimised) ? 64 : 144}
                alt={`${user?.name}'s Image`}
              />
            ) : (
              <FaUser className={(minimisable && minimised) ? "w-7 h-7" : "w-16 h-16"} />
            ))}
          {!streaming.audio && (
            <MdMicOff className="w-6 h-6 absolute right-2 top-2" />
          )}
          {user?.name && (
            <div className={`absolute bottom-4 left-4 font-semibold ${(minimisable && minimised) ? "text-sm" : ""}`}>
              {user?.name}
            </div>
          )}
          {
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="bg-black gap-2 bg-opacity-70 p-2 rounded-lg hidden cursor-pointer group-hover:flex">
                {(!pinned && !minimised) ? (
                  <MdFullscreen
                    onClick={(e: MouseEvent) => {
                        setPinned(videoId);
                        e.stopPropagation();
                    }}
                    className="h-6 w-6 hover:scale-110"
                  />
                ) : (minimisable && minimised) ? <></> : (
                  <MdFullscreenExit
                    onClick={(e: MouseEvent) => {
                        setPinned("");
                        e.stopPropagation();
                    }}
                    className="h-6 w-6 hover:scale-90"
                  />
                )}
                {minimisable && (
                  <>
                    {!minimised ? (
                      <TbWindowMinimize
                        onClick={(e: MouseEvent) => {
                            setMinimised?.(true);
                            e.stopPropagation();
                        }}
                        className="h-6 w-6 hover:scale-110"
                      />
                    ) : (
                      <TbWindowMaximize
                        onClick={(e: MouseEvent) => {
                            setMinimised?.(false);
                            e.stopPropagation()
                        }}
                        className="h-6 w-6 hover:scale-90"
                      />
                    )}
                  </>
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
