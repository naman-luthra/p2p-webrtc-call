import { signIn, useSession } from "next-auth/react";
import { ReactNode, useRef } from "react";
import UserProvider from "./UserProvider";
import Loading from "@/components/Loading";

/**
 * Renders the PrivateRoute component.
 * 
 * @param {Object} props - The component props.
 * @param {ReactNode} props.children - The children of the component.
 * @returns {JSX.Element} The rendered PrivateRoute component.
 */
export default function PrivateRoute(props: {
    children: ReactNode;
  }){
    // data gets the session object and status gets the status of the session.
    const { data: session, status } = useSession();
    if (session) {
        // Signed in
        return (
          <UserProvider userData={{
            name: session?.user?.name || "Unknown",
            image: session?.user?.image || "",
            email: session?.user?.email || ""
            }}>
            {props.children}
          </UserProvider>
        )
      }
    if(status === "loading") return <Loading />
    signIn();
}