import Loading from "@/components/Loading";
import { ReactNode, createContext, useContext } from "react";

// The User context.
const UserContext = createContext<{
    name: string,
    image: string,
    email: string
}>({
    name: "Unknown",
    image: "",
    email: ""
});

/**
 * Hook to get the User context.
 * 
 * @returns The User context.
 */
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
      throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

/**
 * Provides the User context for the application.
 * @remarks
 * This component creates a User context and manages various user details.
 * @param props - The component props.
 * @param props.children - The child components.
 * @returns The UserProvider component.
*/
export default function UserProvider(props: {
    children: ReactNode;
    userData: {
        name: string,
        image: string,
        email: string
    }
  }){
    if(!props.userData) return <Loading />;
    return (
        <UserContext.Provider value={{
            name: props.userData.name || "Unknown",
            image: props.userData.image || "",
            email: props.userData.email || ""
        }}>
        {props.children}
        </UserContext.Provider>
    )
}