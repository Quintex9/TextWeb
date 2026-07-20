"use client";
import { useState, useRef, useEffect } from "react";
import { IoIosSearch } from "react-icons/io";
import ChatWindow from "./components/ChatWindow";
import Header from "./components/Header";
import UsersList from "./components/UsersList";
import UsersSearchPopup from "./components/UsersSearchPopup";

export default function Page() {
  const [activeButton, setActiveButton] = useState("chat");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showSearchPopup, setShowSearchPopup] = useState(false);

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
            <div className="relative flex bg-blue-400 h-11 w-full rounded-t-3xl items-center justify-center">
              <div className=" flex h-8 w-40 border border-stone-200 rounded-3xl bg-stone-100">
                <button className="w-7 h-7  flex justify-center items-center" >
                  <IoIosSearch size={20} className=" ml-0.5" />
                </button>
                <input
                  type="text"
                  value={search}
                  placeholder="Hľadať ľudí..."
                  onFocus={() => setShowSearchPopup(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSearchPopup(true);
                  }}
                  className="w-32 focus: outline-none "
                />
              </div>

              {showSearchPopup && (
                <UsersSearchPopup
                  search={search}
                  onClose={() => setShowSearchPopup(false)}
                />
              )}

            </div>
            <UsersList
              onSelectUser={(userId) => {
                setSelectedChat(userId);
              }}
              onSelectBot={() => {
                setSelectedChat("bot");
              }}
            />
          </div>
        )}

        {activeButton === "groups" && (
          <div className="flex flex-col w-full items-center justify-center">
            <p>Tu budú skupiny</p>
          </div>
        )}

        {activeButton === "chat" && selectedChat === "bot" && (
          <ChatWindow
            chatType="bot"
            goBack={() => setSelectedChat(null)}
          />
        )}

        {activeButton === "chat" &&
          selectedChat !== null &&
          selectedChat !== "bot" && (
            <ChatWindow
              chatType="user"
              chatName="Používateľ"
              goBack={() => setSelectedChat(null)}
            />
          )}

      </section>
    </main>
  );
}