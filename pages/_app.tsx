import { PeerProvider } from '@/context/PeersProvider'
import { SocketProvider } from '@/context/SocketProvider'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from "next-auth/react"
import PrivateRoute from '@/context/PrivateRoute'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return(
    <SessionProvider session={session}>
      <PrivateRoute>
        <PeerProvider>
          <SocketProvider>
            <Component {...pageProps} />
          </SocketProvider>
        </PeerProvider>
      </PrivateRoute>
    </SessionProvider>
  )
}