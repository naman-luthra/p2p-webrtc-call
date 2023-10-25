import { signIn, useSession } from "next-auth/react";
import { ReactNode, useRef } from "react";
import UserProvider from "./UserProvider";

export default function PrivateRoute(props: {
    children: ReactNode;
  }){
    const { data: session, status } = useSession();
    if (session) {
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
    if(status === "loading") return <>Loading...</>
    signIn();
}