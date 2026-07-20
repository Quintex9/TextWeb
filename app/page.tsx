"use client";

import { useEffect, useState } from "react";
import { IoIosSearch } from "react-icons/io";
import ChatWindow from "./components/ChatWindow";
import GroupsPanel from "./components/GroupsPanel";
import Header from "./components/Header";
import UsersList from "./components/UsersList";
import UsersSearchPopup from "./components/UsersSearchPopup";
import { getOrCreateDirectChat } from "./lib/chats";
import { supabase } from "./lib/supabase";

export default function Page() {
  const [signedIn, setSignedIn] = useState(false);
  const [activeButton, setActiveButton] = useState("chat");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatName, setSelectedChatName] = useState("Pouzivatel");
  const [chatError, setChatError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showSearchPopup, setShowSearchPopup] = useState(false);

  const resetPageState = () => {
    setActiveButton("chat");
    setSelectedChat(null);
    setSelectedChatName("Pouzivatel");
    setChatError(null);
    setSearch("");
    setShowSearchPopup(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setSignedIn(!!user);

      if (!user) {
        resetPageState();
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(!!session?.user);

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        resetPageState();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const openDirectChat = async (userId: string, username: string) => {
    setChatError(null);

    const chatId = await getOrCreateDirectChat(userId);

    if (!chatId) {
      setChatError("Chat mozes otvorit az po prijatom follow vztahu.");
      return;
    }

    setSelectedChatName(username);
    setSelectedChat(chatId);
  };

  const openGroupChat = (chatId: string, chatName: string) => {
    setActiveButton("chat");
    setSelectedChatName(chatName);
    setSelectedChat(chatId);
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-200">
      <Header />

      <section className="flex flex-col items-center justify-center pt-2">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">
          Vitaj v prototype textoveho webu
        </h2>
      </section>

      <section className="flex flex-row items-center justify-center pb-2">
        <button
          type="button"
          className={`mx-1 mt-3 h-10 w-20 rounded-2xl ${activeButton === "chat" ? "bg-blue-600 text-white" : "bg-blue-500"
            }`}
          onClick={() => {
            setActiveButton("chat");
            setSelectedChat(null);
          }}
        >
          Chat
        </button>
        <button
          type="button"
          className={`mx-1 mt-3 h-10 w-20 rounded-2xl ${activeButton === "groups" ? "bg-blue-600 text-white" : "bg-blue-500"
            }`}
          onClick={() => {
            setActiveButton("groups");
            setSelectedChat(null);
          }}
        >
          Skupiny
        </button>
      </section>

      <section className="flex min-h-110 w-1/3 self-center rounded-3xl shadow-md">
        {!signedIn && (
          <div className="flex w-full flex-col items-center justify-center rounded-3xl bg-white p-6 text-center">
            <h3 className="text-lg font-bold text-stone-800">
              Prihlas sa pre chat
            </h3>
            <p className="mt-2 text-sm text-stone-500">
              Po prihlaseni uvidis kontakty, skupiny a spravy.
            </p>
          </div>
        )}

        {signedIn && activeButton === "chat" && selectedChat === null && (
          <div className="flex w-full flex-col">
            <div className="relative flex h-11 w-full items-center justify-center rounded-t-3xl bg-blue-400">
              <div className="flex h-8 w-40 rounded-3xl border border-stone-200 bg-stone-100">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center"
                >
                  <IoIosSearch size={20} className="ml-0.5" />
                </button>
                <input
                  type="text"
                  value={search}
                  placeholder="Hladas ludi..."
                  onFocus={() => setShowSearchPopup(true)}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setShowSearchPopup(true);
                  }}
                  className="w-32 outline-none"
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
              onSelectUser={openDirectChat}
              onSelectBot={() => {
                setSelectedChatName("Chat bot");
                setSelectedChat("bot");
              }}
            />

            {chatError && (
              <p className="px-4 pb-3 text-center text-sm text-red-500">
                {chatError}
              </p>
            )}
          </div>
        )}

        {signedIn && activeButton === "groups" && (
          <GroupsPanel onSelectGroup={openGroupChat} />
        )}

        {signedIn && activeButton === "chat" && selectedChat === "bot" && (
          <ChatWindow
            chatType="bot"
            goBack={() => setSelectedChat(null)}
          />
        )}

        {activeButton === "chat" &&
          signedIn &&
          selectedChat !== null &&
          selectedChat !== "bot" && (
            <ChatWindow
              chatType="user"
              chatId={selectedChat}
              chatName={selectedChatName}
              goBack={() => setSelectedChat(null)}
            />
          )}
      </section>
    </main>
  );
}
