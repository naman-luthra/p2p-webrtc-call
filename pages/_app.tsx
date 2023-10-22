import { SocketProvider } from '@/context/SocketProvider'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return(
    <SocketProvider>
      <Component {...pageProps} />
    </SocketProvider>
  )
}
