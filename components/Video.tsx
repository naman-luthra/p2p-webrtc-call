import Image from "next/image";
import { ReactNode } from "react";
import { FaUser } from "react-icons/fa";
import { MdFullscreen, MdFullscreenExit, MdMicOff } from "react-icons/md";
import { TbWindowMaximize, TbWindowMinimize } from "react-icons/tb";

/**
 * Video component for displaying a video stream with controls and user information.
 *
 * @param videoId - The ID of the video element.
 * @param streaming - An object indicating whether audio and video are being streamed.
 * @param user - An object containing user information, including image and name.
 * @param children - Optional ReactNode to render additional content within the video component.
 * @param pinned - The ID of the currently pinned video.
 * @param setPinned - A function to set the ID of the pinned video.
 * @param minimisable - A boolean indicating whether the video can be minimised.
 * @param minimised - A boolean indicating whether the video is currently minimised.
 * @param setMinimised - A function to set the minimised state of the video.
 * @returns The Video component.
 */
export default function Video({
  videoId,
  streaming,
  user,
  children,
  pinnable,
  pinned,
  setPinned,
  minimisable,
  minimised,
  setMinimised,
  position,
  className
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
  pinnable: boolean;
  pinned?: string;
  setPinned?: (pinned: string) => void;
  minimisable: boolean;
  minimised?: boolean;
  setMinimised?: (minimised: boolean) => void;
  position?: "absolute" | "relative" | "fixed";
  className?: string;
}) {

  return (
    <div
      id={`container-${videoId}`}
      className={
        (minimisable && minimised
          ? "p-2 z-20"
          : `p-2 ${
              pinned && pinned !== videoId ? "hidden" : "block"
            }`) + " " + className
      }
      style={{
        position: position ? position : "absolute"
      }}
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
              {
                (minimisable || pinnable) &&
                <div className="bg-black gap-2 bg-opacity-70 p-2 rounded-lg hidden cursor-pointer group-hover:flex">
                {(!pinned && !minimised) ? (
                  <MdFullscreen
                    onClick={(e: MouseEvent) => {
                        setPinned?.(videoId);
                        e.stopPropagation();
                    }}
                    className="h-6 w-6 hover:scale-110"
                  />
                ) : ((minimisable && minimised)) ? <></> : (
                  <MdFullscreenExit
                    onClick={(e: MouseEvent) => {
                        setPinned?.("");
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
              }
            </div>
          }
          {children}
        </div>
      </div>
    </div>
  );
}
