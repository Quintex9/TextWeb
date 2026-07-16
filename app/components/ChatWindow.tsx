import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { IoArrowBack } from "react-icons/io5";
import { IoMdMenu } from "react-icons/io";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import EmojiPicker from "../components/EmojiPicker";
import { RiRobot2Line } from "react-icons/ri";
import { getElizaResponse } from "../lib/eliza";

type ChatWindowProps = {
    chatType: "user" | "bot",
    chatName?: string,
    goBack: () => void;
}

type ChatMessage = {
    id: string,
    content: string,
    sender: "me" | "other" | "bot"
}

export default function ChatWindow({
    chatType,
    chatName,
    goBack,
}: ChatWindowProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [message, setMessage] = useState("");

    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<ChatMessage[]>(
        chatType === "bot" ? [{
            id: "welcome-message",
            content: "Ahoj, som chatový bot",
            sender: "bot",
        }] : []
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };

    }, []);

    const handleSendMessage = () => {
        const trimmedMessage = message.trim();

        if (!trimmedMessage) return;

        const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            content: trimmedMessage,
            sender: "me",
        }

        setMessages((prevMessages) => [
            ...prevMessages,
            newMessage,
        ]);

        setMessage("")
        setShowEmojiPicker(false);

        if (chatType === "bot") {
            const botResponse: ChatMessage = {
                id: crypto.randomUUID(),
                content: getElizaResponse(trimmedMessage),
                sender: "bot"
            };

            setTimeout(() => {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    botResponse,
                ]);
            }, 500)
        }
    }


    return (
        <div className="flex flex-col w-full h-120">
            {/* HEADER CHATU */}
            <div className="bg-blue-400 w-full h-12 flex items-center justify-start pl-2 rounded-t-3xl">
                <button
                    onClick={() => goBack()}
                    className={`h-10 w-10  hover:shadow-xl hover:border-2 flex items-center justify-center rounded-full`}
                >
                    <IoArrowBack size={20} color="white" />
                </button>

                {chatType === "user" &&
                    <Image src="/chat/placeholder.svg" alt="Chat placeholder" className="ml-45" width={40} height={40} />}

                {chatType === "bot" &&
                    <div className="absolute left-1/2"
                    >
                        <RiRobot2Line size={25} />
                    </div>}

                <IoMdMenu size={25} color="white" className="ml-auto mr-2" />
            </div>

            {/* SPRÁvy */}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
                {messages.map((item) => (
                    <div
                        key={item.id}
                        className={`max-w-3/4 rounded-2xl px-3 py-2 flex gap-2 ${item.sender === "me"
                            ? "ml-auto bg-blue-500 text-white"
                            : "mr-auto bg-stone-300 text-stone-800"
                            }`}
                    >
                        {item.sender === "bot" && <RiRobot2Line size={20} />}
                        <span className="min-w-0 break-words max-w-[25ch]">
                            {item.content}
                        </span>
                    </div>
                ))}
            </div>

            <div ref={emojiPickerRef} className="relative flex mt-auto h-8 rounded-3xl border border-stone-400 text-stone-800">
                <input
                    type="text"
                    placeholder="Napíš správu..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    className="ml-2 bg-transparent border-none focus:outline-none w-full"
                />

                <button
                    type="button"
                    className="mr-2 translate-y-0.5"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <MdOutlineEmojiEmotions size={25} />
                </button>

                {showEmojiPicker && (
                    <EmojiPicker
                        onSelectEmoji={(emoji) => {
                            setMessage((prevMessage) => prevMessage + emoji);
                            setShowEmojiPicker(false);
                        }}
                    />
                )}
            </div>
        </div>
    )
}