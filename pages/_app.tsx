import { PeerProvider } from '@/context/PeersProvider'
import { SocketProvider } from '@/context/SocketProvider'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return(
    <PeerProvider>
      <SocketProvider>
        <Component {...pageProps} />
      </SocketProvider>
    </PeerProvider>
  )
}
