import { PeerProvider } from '@/context/PeersProvider'
import { SocketProvider } from '@/context/SocketProvider'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from "next-auth/react"
import PrivateRoute from '@/context/PrivateRoute'


/**
 * Renders the main App component.
 * 
 * @param {AppProps} props - The component props.
 * @param {React.ComponentType} props.Component - The component to be rendered.
 * @param {Object} props.pageProps - The page props.
 * @param {Object} props.pageProps.session - The session object.
 * @returns {JSX.Element} The rendered App component.
 */
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