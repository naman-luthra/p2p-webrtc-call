import { firestore } from '@/firebase/clientApp'
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  roomId: string
}

function generateRoomId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 9; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // check if room exists
  let generated = false;
  let collisions = 0;
  while(!generated){
    const roomId = generateRoomId();
    const roomsRef = collection(firestore, 'rooms');
    const roomQuery =  query(roomsRef, where('roomId', '==', roomId));
    const result = await getDocs(roomQuery);
    if (result.docs.length === 0) {
        await setDoc(doc(roomsRef), { roomId: roomId });
        res.status(200).json({ roomId: roomId });
        generated = true;
    }
    else{
        collisions++;
        if(collisions > 28){
            res.status(500);
            break;
        }
    }
  }
}