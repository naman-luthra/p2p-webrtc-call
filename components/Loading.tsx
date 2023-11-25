/**
 * Renders a loading spinner component.
 * @returns The loading spinner component.
 */
export default function Loading({text}:{text?:string}) {
    return (
        <div className="h-screen w-full flex flex-col gap-4 justify-center items-center bg-black">
            <div className="text-white text-3xl font-semibold">{text || "Loading..."}</div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-slate-50"></div>
        </div>
    );
}