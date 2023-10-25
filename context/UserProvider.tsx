import { ReactNode, createContext, useContext } from "react";

const UserContext = createContext<{
    name: string,
    image: string,
    email: string
}>({
    name: "Unknown",
    image: "",
    email: ""
});

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
      throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

export default function UserProvider(props: {
    children: ReactNode;
    userData: {
        name: string,
        image: string,
        email: string
    }
  }){
    console.log(props.userData);
    if(!props.userData) return <>Loading...</>;
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