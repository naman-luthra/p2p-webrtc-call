"use client";
import { SocketContext } from "@/context/SocketProvider";
import { useRouter } from "next/router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

export default function Room({}){
    console.log("rendered");
    const router = useRouter();
    const { id } = router.query;

    const [callDoc, setCallDoc] = useState(null);
    const [peers, setPeers] = useState<{peer: RTCPeerConnection, to:string}[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [video, setVideo] = useState<MediaStream | null>(null);
    const [remoteVideos, setRemoteVideos] = useState<(MediaStream | null)[]>([]);
    const handleVideoOn = ()=>{
        navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream=>{
            setVideo(stream)
            peers.forEach((peer)=>{
                for (const track of stream.getTracks()) {
                    peer.peer.addTrack(track, stream);
                }
            });
        });
    };
    const handleVideoOff = ()=>{
        video?.getTracks().forEach(track=>track.stop());
        setVideo(null);
    };

    const socket = useContext(SocketContext);

    const servers = {
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      };

    const handleCreateOffers = useCallback(async (connections: {
        sockets: string[],
        roomId: string
    }) => {
        const offers: {offer: RTCSessionDescriptionInit, to:string}[] = [];
        const newPeers: {peer: RTCPeerConnection, to:string}[] = [];
        const existingPeers = peers.length;
        console.log("connections",connections);
        for(let i=0;i<connections.sockets.length;i++){
            const peer = new RTCPeerConnection(servers);
            newPeers.push({peer, to: connections.sockets[i]});
            const offerDescription = await peer.createOffer();
            await peer.setLocalDescription(new RTCSessionDescription(offerDescription));
            offers.push({offer: offerDescription, to: connections.sockets[i]});
        }
        console.log("offers",offers);
        setRemoteVideos(remoteVideos ? [...remoteVideos, ...newPeers.map(()=>null)] : newPeers.map(()=>null));
        setPeers([...peers, ...newPeers]);
        socket?.emit("offersCreated", connections.roomId, offers);
    },[peers, remoteVideos, servers, socket]);

    const handleAcceptOffer = useCallback(async (offerWithSender: {
        offer: RTCSessionDescriptionInit,
        sender: string,
        roomId: string
    }) => {
        const peer = new RTCPeerConnection(servers);
        setRemoteVideos(remoteVideos ? [...remoteVideos, null] : [null]);
        setPeers([...peers, {peer, to: offerWithSender.sender}]);
        await peer.setRemoteDescription(new RTCSessionDescription(offerWithSender.offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(new RTCSessionDescription(answer));
        socket?.emit("answerCreated", {
            roomId: offerWithSender.roomId,
            answer,
            receiver: offerWithSender.sender
        });
    },[peers, remoteVideos, servers, socket]);

    const handleSaveAnswer = useCallback(async (answerWithPeer: {
        answer: RTCSessionDescriptionInit,
        sender: string
    }) => {
        console.log(answerWithPeer);
        try {
            console.log("saving",peers);
            peers.find(({to})=>to===answerWithPeer.sender)?.peer.setRemoteDescription(new RTCSessionDescription(answerWithPeer.answer));
            console.log("saved");
        } catch (error) {
            console.log(error);
        }
    },[peers]);

    const handleNegoInit = useCallback(async (peer: {peer: RTCPeerConnection, to:string})=>{
        const offerDescription = await peer.peer.createOffer();
        await peer.peer.setLocalDescription(offerDescription);
        socket?.emit("negoOffer", {offer: offerDescription, to: peer.to});
    },[socket]);

    const handleNegoOfferAccept = useCallback(async (offerWithSender: {
        offer: RTCSessionDescriptionInit,
        sender: string
    })=>{
        const peer = peers.find(({to})=>to===offerWithSender.sender);
        console.log("negopeer",peer, peers, offerWithSender.sender);
        if(!peer) return;
        await peer.peer.setRemoteDescription(new RTCSessionDescription(offerWithSender.offer));
        const answer = await peer.peer.createAnswer();
        await peer.peer.setLocalDescription(new RTCSessionDescription(answer));
        socket?.emit("negoAnswerCreated", {answer, to: offerWithSender.sender});
    },[peers, socket]);

    const handleNegoSaveAnswer = useCallback(async (answerWithPeer: {
        answer: RTCSessionDescriptionInit,
        sender: string
    })=>{
        const peer = peers.find(({to})=>to===answerWithPeer.sender);
        if(!peer) return;
        await peer.peer.setRemoteDescription(new RTCSessionDescription(answerWithPeer.answer));
    },[peers]);

    console.log(peers);

    useEffect(() => {
        if(!socket) return;
        socket.on("createOffers", handleCreateOffers);
        socket.on("acceptOffer", handleAcceptOffer);
        socket.on("saveAnswer", handleSaveAnswer);
        socket.on("negoOfferAccept", handleNegoOfferAccept);
        socket.on("negoSaveAnswer", handleNegoSaveAnswer);
    
        return () => {
            socket.off("createOffers", handleCreateOffers);
            socket.off("acceptOffer", handleAcceptOffer);
            socket.off("saveAnswer", handleSaveAnswer);
            socket.off("negoOfferAccept", handleNegoOfferAccept);
            socket.off("negoSaveAnswer", handleNegoSaveAnswer);
        };
      }, [
        socket,
        handleCreateOffers,
        handleAcceptOffer,
        handleSaveAnswer,
        handleNegoOfferAccept,
        handleNegoSaveAnswer,
    ]);

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
    useEffect(() => {
        peers.forEach((peer,i)=>{
            peer.peer.addEventListener("track", async (event) => {
                setRemoteVideos(remoteVideos ? remoteVideos.map((remoteVideo, id)=>{
                    if(id===i){
                        const newStream = new MediaStream();
                        event.streams[0].getTracks().forEach((track) => {
                            newStream.addTrack(track);
                        });
                        return newStream;
                    }
                    return remoteVideo;
                }) : []);
            });
        });
    }, [peers, remoteVideos]);

    useEffect(() => {
        peers.forEach((peer)=>{
            peer.peer.addEventListener("negotiationneeded", ()=>handleNegoInit(peer))
        });
        return () => {
            peers.forEach((peer)=>{
                peer.peer.removeEventListener("negotiationneeded", ()=>handleNegoInit(peer))
            });
        }
    }, [peers, handleNegoInit]);

    useEffect(() => {
        remoteVideos?.forEach((remoteVideo, id)=>{
            if(!remoteVideo) return;
            const videoEle = document.getElementById(`remoteVideo-${id}`) as HTMLVideoElement;
            videoEle.srcObject = remoteVideo;
        });
    }, [remoteVideos]);

    console.log(remoteVideos);

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
                remoteVideos.map((_,id)=>(
                    <div key={id} className="w-1/2 h-screen relative group">
                        <video  id={`remoteVideo-${id}`} autoPlay className="w-full h-full relative"/>
                    </div>
                ))
            }
        </div>
    );
}