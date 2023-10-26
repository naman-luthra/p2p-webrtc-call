import { Chat } from "@/context/types";
import { useState } from "react";
import { MdCancel, MdSend } from "react-icons/md";

export default function ChatBar({
  chatHistory,
  handleChatSend,
  chatVisible,
  setChatVisible,
}: {
  chatHistory: Chat[];
  handleChatSend: (chatInput: string) => void;
  chatVisible: boolean;
  setChatVisible: (visible: boolean) => void;
}) {
  const [chatInput, setChatInput] = useState<string>("");
  const handleSend = () => {
    handleChatSend(chatInput);
    setTimeout(() => {
      const chatBar = document.getElementById("chatBar");
      if (chatBar != null) chatBar.scrollTop = chatBar.scrollHeight;
    }, 100);
    setChatInput("");
  };
  return (
    <>
      <div
        className="h-[85vh] relative"
        style={{ display: chatVisible ? "block" : "none" }}
      >
        <div className="flex justify-between pt-2">
          <div className="font-semibold text-xl">Chat</div>
          <MdCancel
            className="w-6 h-6 cursor-pointer hover:opacity-90"
            onClick={() => {
              setChatVisible(false);
            }}
          />
        </div>
        <div
          id="chatBar"
          className="pt-4 flex flex-col gap-2 max-h-[80vh] overflow-y-auto text-sm"
        >
          {chatHistory.map(({ message, sender, time }, id) => (
            <div key={id}>
              <div className="flex gap-1">
                <span className="font-semibold">{sender}</span>
                <span>
                  {time.toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="pl-0.5">{message}</div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="grow items-center"
        style={{ display: chatVisible ? "flex" : "none" }}
      >
        <div className="w-full flex h-10 py-1 px-2 justify-center items-center rounded-lg bg-gray-200">
          <input
            type="text"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="grow bg-gray-200 focus:outline-none"
          />
          <MdSend onClick={handleSend} className="w-6 h-6 hover:opacity-90" />
        </div>
      </div>
    </>
  );
}
