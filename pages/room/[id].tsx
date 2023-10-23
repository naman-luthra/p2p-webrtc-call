"use client";
import { PeerContext } from "@/context/PeersProvider";
import { SocketContext } from "@/context/SocketProvider";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";

export default function Room({}){
    console.log("rendered");
    const router = useRouter();
    const { id } = router.query;

    const socket = useContext(SocketContext);
    const peerContext = useContext(PeerContext);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [video, setVideo] = useState<MediaStream | null>(null);

    const [refresher, setRefresher] = useState(1);

    const handleVideoOn = ()=>{
        navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream=>{
            setVideo(stream)
            peerContext?.sendStream(stream);
        });
    };
    const handleVideoOff = ()=>{
        video?.getTracks().forEach(track=>track.stop());
        if(socket) peerContext?.stopStream(socket);
        setVideo(null);
    };

    useEffect(()=>{
        if(!socket || !id) return;
        socket.emit("roomJoined", id as string);
        return ()=>{
            socket.emit("roomLeft", id as string);
        }
    },[socket, id]);

    useEffect(() => {
        if(!videoRef.current) return;
        videoRef.current.srcObject = video;
    }, [video]);

    console.log(peerContext?.peers);

    return (
        <div className="flex">
            <div className="w-1/2 h-screen relative group">
                <video id="localVideo" ref={videoRef} autoPlay muted className="w-full h-full relative"/>
                <div className="absolute z-10 top-0 left-0 w-full h-full flex justify-center items-center">
                    {
                        video ? (
                            <button onClick={handleVideoOff} className="px-3 py-1 border border-gray-800 rounded-lg hidden group-hover:block">Stop Video</button>
                        ) : (
                            <button onClick={handleVideoOn} className="px-3 py-1 border border-gray-800 rounded-lg">Start Video</button>
                        )
                    }
                </div>
            </div>
            {
                peerContext?.peers.map(({stream},id)=>(
                    <div key={id} className="w-1/2 h-screen relative group">
                        {
                            (stream) &&
                            <ReactPlayer playing url={stream}/>
                        }
                    </div>
                ))
            }
            <button onClick={()=>{setRefresher(refresher*-1)}}>Rerender</button>
        </div>
    );
}