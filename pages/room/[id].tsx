"use client";
import { PeerContext } from "@/context/PeersProvider";
import { SocketContext } from "@/context/SocketProvider";
import { useRouter } from "next/router";
import { use, useContext, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";

export default function Room({}){
    console.log("rendered");
    const router = useRouter();
    const { id } = router.query;

    const socket = useContext(SocketContext);
    const peerContext = useContext(PeerContext);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [video, setVideo] = useState<MediaStream | null>(null);

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

    const remoteStreams = peerContext?.peers.map(({stream})=>stream);

    const [ audioPlaying, setAudioPlaying ] = useState<boolean[]>([]);

    useEffect(()=>{
        if(!remoteStreams) return;
        remoteStreams?.forEach((stream, id)=>{
            const remoteVideo = document.getElementById(`remoteVideo${id}`) as HTMLVideoElement;
            const remoteAudio = document.getElementById(`remoteAudio${id}`) as HTMLAudioElement;
            if(remoteVideo){
                remoteVideo.srcObject = stream;
            }
            if(remoteAudio){
                remoteAudio.srcObject = stream;
                if(!audioPlaying[id]) remoteAudio.pause();
                else remoteAudio.play();
            }
        });
        return ()=>{
            remoteStreams?.forEach((_, id)=>{
                const remoteVideo = document.getElementById(`remoteVideo${id}`) as HTMLVideoElement;
                const remoteAudio = document.getElementById(`remoteAudio${id}`) as HTMLAudioElement;
                if(remoteVideo){
                    remoteVideo.srcObject = null;
                }
                if(remoteAudio){
                    remoteAudio.srcObject = null;
                }
            });
        }
    },[remoteStreams, audioPlaying]);

    useEffect(()=>{
        console.log("audio playing", audioPlaying);
        audioPlaying.forEach((playing, id)=>{
            const remoteAudio = document.getElementById(`remoteAudio${id}`) as HTMLAudioElement
            if(remoteAudio){
                if(playing){
                    if(remoteAudio.paused) remoteAudio.play();
                }
                else{
                    if(!remoteAudio.paused) remoteAudio.pause();
                }
            }
        });
    },[audioPlaying]);

    console.log(peerContext?.peers);

    return (
        <div className="grid w-full h-screen gap-4 p-4" style={{
            gridTemplateColumns: `repeat(${!peerContext?.peers.length ? 1 : peerContext?.peers.length<4 ? 2 : 3}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${!peerContext?.peers.length ? 1 : peerContext?.peers.length<2 ? 1 : 2}, minmax(0, 1fr))`
            }}>
            <div className="w-full h-full relative group rounded-lg border-sky-500 border-4">
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
                    <div key={id} className="w-full h-full relative group rounded-lg border-sky-500 border-4">
                        {
                            (stream) &&
                            <>
                                <audio id={`remoteAudio${id}`} className="hidden"></audio>
                                <video id={`remoteVideo${id}`} playsInline autoPlay muted className="w-full h-full"></video>
                                <div className="h-full w-full absolute top-0 right-0 flex justify-center items-center">
                                    <button onClick={
                                        ()=>{
                                            setAudioPlaying(prev=>{
                                                const newAudioPlaying = [...prev];
                                                newAudioPlaying[id] = !newAudioPlaying[id];
                                                return newAudioPlaying;
                                            });
                                        }
                                    } className={`bg-sky-600 px-4 py-2 rounded-2xl text-white text-xl font-semibold`}>{
                                        audioPlaying[id] ? 'Mute' : 'Unmute'
                                    }</button>
                                </div>
                            </>
                        }
                    </div>
                ))
            }
        </div>
    );
}