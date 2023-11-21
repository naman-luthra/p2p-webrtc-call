/**
 * Renders a loading spinner component.
 * @returns The loading spinner component.
 */
export default function Loading() {
    return (
        <div className="h-screen w-full flex justify-center items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
        </div>
    );
}