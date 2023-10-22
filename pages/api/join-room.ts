import { firestore } from '@/firebase/clientApp'
import { collection, getDocs, query, where } from 'firebase/firestore'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  roomId: string | null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // check if room exists
  const { roomId } = req.body;
  const roomsRef = collection(firestore, 'rooms');
  const roomQuery =  query(roomsRef, where('roomId', '==', roomId));
  const result = await getDocs(roomQuery);
  if (result.docs.length === 0) {
    res.status(404).json({ roomId: null });
  }
  else {
    res.status(200).json({ roomId: result.docs[0].data().roomId });
  }
}