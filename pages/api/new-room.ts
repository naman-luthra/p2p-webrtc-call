import { firestore } from '@/firebase/clientApp'
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { randomUUID } from 'crypto'

type Data = {
  roomId: string,
  secret: string
} | {
  error: string
}

/**
 * Generates a random room ID consisting of 9 lowercase alphabetic characters.
 * 
 * @returns The generated room ID.
 */
function generateRoomId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 9; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Handles the creation of a new room.
 * 
 * @param req - The NextApiRequest object.
 * @param res - The NextApiResponse object.
 * @returns A JSON response containing the roomId and secret if successful, or an error message if failed.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ error: "Not Authorized!" });
    return;
  }
  let generated = false;
  let collisions = 0;
  while(!generated){
    const roomId = generateRoomId();
    const roomsRef = collection(firestore, 'rooms');
    const roomQuery =  query(roomsRef, where('roomId', '==', roomId));
    const result = await getDocs(roomQuery);
    if (result.docs.length === 0) {
        const newSecret = randomUUID();
        await setDoc(doc(roomsRef), { roomId: roomId, users: [{
          email: session.user?.email,
        }], secret: newSecret });
        res.status(200).json({
          roomId: roomId,
          secret: newSecret
        });
        generated = true;
    }
    else{
        collisions++;
        if(collisions > 28){
            res.status(500).json({ error: "Failed to generate room id!" });
            break;
        }
    }
  }
}