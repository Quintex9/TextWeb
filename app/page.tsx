"use client";
import { useState, useRef, useEffect } from "react";
import { IoIosSearch } from "react-icons/io";
import Image from "next/image";
import { IoArrowBack } from "react-icons/io5";
import { IoMdMenu } from "react-icons/io";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import EmojiPicker from "./components/EmojiPicker";
import Header from "./components/Header";
import UsersList from "./components/UsersList";

export default function Page() {
  const [activeButton, setActiveButton] = useState("chat");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };

  }, []);

  const chats = [
    {
      id: "chat1",
      name: "Náhodná osoba",
      lastMessage: "Čau",
    },
    {
      id: "chat2",
      name: "Náhodná osoba 2",
      lastMessage: "Ahoj",
    }
  ];

  const currentChat = chats.find(chat => chat.id === selectedChat);

  return (
    <main className="flex min-h-screen flex-col bg-gray-200">

      <Header />

      <section className="flex flex-col justify-center items-center pt-2">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Vítaj v prototype textového webu
        </h2>
      </section>


      <section className="flex flex-row justify-center items-center pb-2">
        <button className={`w-20 h-10 rounded-2xl mt-3 mx-1 ${activeButton === "chat" ? "bg-blue-600 text-white" : "bg-blue-500"}`}
          onClick={() => setActiveButton("chat")}>
          Chat
        </button>
        <button className={`w-20 h-10 rounded-2xl mt-3 mx-1 ${activeButton === "groups" ? "bg-blue-600 text-white" : "bg-blue-500"}`}
          onClick={() => setActiveButton("groups")}>
          Skupiny
        </button>
      </section>

      <section className="flex min-h-110 w-1/3 self-center shadow-md rounded-3xl">
        {activeButton === "chat" && selectedChat === null && (
          <div className="flex flex-col w-full">
            {/* HEADER CHAT ZOZNAMU */}
            <div className="flex bg-blue-400 h-11 w-full rounded-t-3xl items-center justify-center">
              <div className="flex h-8 w-40 border border-stone-200 rounded-3xl bg-stone-100">
                <button className="w-7 h-7  flex justify-center items-center" >
                  <IoIosSearch size={20} className=" ml-0.5" />
                </button>
                <input
                  type="text"
                  className="w-32 focus: outline-none "
                />
              </div>
            </div>
            <UsersList
              onSelectUser={(userId) => {
                console.log("Klikol som na usera:", userId);
              }}
            />
          </div>
        )}

        {activeButton === "groups" && (
          <div className="flex flex-col w-full items-center justify-center">
            <p>Tu budú skupiny</p>
          </div>
        )}

        {activeButton === "chat" && currentChat && (
          <div className="flex flex-col w-full">
            {/* HEADER CHATU */}
            <div className="bg-blue-400 w-full h-12 flex items-center justify-start pl-2 rounded-t-3xl">
              <button className={`h-10 w-10  hover:shadow-xl hover:border-2 flex items-center justify-center rounded-full`}
                onClick={() => {
                  setSelectedChat(null);
                  setActiveButton("chat")
                }}>
                <IoArrowBack size={20} color="white" />
              </button>
              <Image src="/chat/placeholder.svg" alt="Chat placeholder" className="ml-45" width={40} height={40} />
              <IoMdMenu size={25} color="white" className="ml-auto mr-2" />
            </div>

            <>
            </>

            <div ref={emojiPickerRef} className="relative flex mt-auto h-8 rounded-3xl border border-stone-400 text-stone-800">
              <input
                type="text"
                placeholder="Napíš správu..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="ml-2 bg-transparent border-none focus:outline-none w-full"
              />

              <button
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
        )}

      </section>
    </main>
  );
}