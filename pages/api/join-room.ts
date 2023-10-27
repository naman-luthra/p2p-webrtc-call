import { firestore } from '@/firebase/clientApp'
import { collection, getDocs, query, where } from 'firebase/firestore'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'

type Data = {
  roomId: string,
  action: 'join',
  secret: string
} | {
  roomId: string,
  action: 'request'
} | {
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ error: "Not Authorized!" });
    return;
  }
  const { roomId } = req.body;
  if(!roomId){
    res.status(400).json({ error: "No room id provided!" });
    return;
  }
  const roomsRef = collection(firestore, 'rooms');
  const roomQuery =  query(roomsRef, where('roomId', '==', roomId));
  const result = await getDocs(roomQuery);
  if (result.docs.length === 0) {
    res.status(404).json({ error: "Room not found!" });
  }
  else {
    if(result.docs[0].data().users.find(({email}:{email: string})=>email===session.user?.email))
      res.status(200).json({ roomId, action: 'join', secret: result.docs[0].data().secret });
    else{
      res.status(200).json({ roomId, action: 'request'});
    }
  }
}