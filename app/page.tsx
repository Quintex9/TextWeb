"use client";

import { useCallback, useEffect, useState } from "react";
import { IoIosSearch } from "react-icons/io";
import ChatWindow from "./components/ChatWindow";
import GroupsPanel from "./components/GroupsPanel";
import Header from "./components/Header";
import UsersList from "./components/UsersList";
import UsersSearchPopup from "./components/UsersSearchPopup";
import { getOrCreateDirectChat, markChatAsRead } from "./lib/chats";
import { supabase } from "./lib/supabase";

export default function Page() {
  const [signedIn, setSignedIn] = useState(false);
  const [activeButton, setActiveButton] = useState("chat");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatName, setSelectedChatName] = useState("Používateľ");
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(
    null,
  );
  const [readAtByChatId, setReadAtByChatId] = useState<Record<string, string>>(
    {},
  );
  const [chatListRefreshKey, setChatListRefreshKey] = useState(0);
  const [chatError, setChatError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showSearchPopup, setShowSearchPopup] = useState(false);

  const refreshChatLists = useCallback(() => {
    setChatListRefreshKey((currentKey) => currentKey + 1);
  }, []);

  const markChatAsLocallyRead = useCallback((chatId: string) => {
    setReadAtByChatId((currentReadAtByChatId) => ({
      ...currentReadAtByChatId,
      [chatId]: new Date().toISOString(),
    }));
  }, []);

  const handleChatRead = useCallback(
    (chatId: string) => {
      markChatAsLocallyRead(chatId);
      refreshChatLists();
    },
    [markChatAsLocallyRead, refreshChatLists],
  );

  const resetPageState = useCallback(() => {
    setActiveButton("chat");
    setSelectedChat(null);
    setSelectedChatName("Používateľ");
    setSelectedChatUserId(null);
    setChatError(null);
    setSearch("");
    setShowSearchPopup(false);
    setReadAtByChatId({});
    refreshChatLists();
  }, [refreshChatLists]);

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
  }, [resetPageState]);

  useEffect(() => {
    if (!signedIn) return;

    const channel = supabase
      .channel("chat-list-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          refreshChatLists();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [signedIn, refreshChatLists]);

  const openDirectChat = async (userId: string, username: string) => {
    setChatError(null);

    const chatId = await getOrCreateDirectChat(userId);

    if (!chatId) {
      setChatError("Chat môžeš otvoriť až po prijatom follow vzťahu.");
      return;
    }

    setSelectedChatName(username);
    setSelectedChatUserId(userId);
    setSelectedChat(chatId);
    markChatAsLocallyRead(chatId);

    const success = await markChatAsRead(chatId);

    if (success) {
      refreshChatLists();
    }
  };

  const openGroupChat = async (chatId: string, chatName: string) => {
    setActiveButton("chat");
    setSelectedChatName(chatName);
    setSelectedChatUserId(null);
    setSelectedChat(chatId);
    markChatAsLocallyRead(chatId);

    const success = await markChatAsRead(chatId);

    if (success) {
      refreshChatLists();
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <Header />

      <section className="flex flex-col items-center justify-center pt-2">
        <h2 className="mb-2 text-2xl font-bold text-slate-900">
          Vitaj v prototype textového webu
        </h2>
      </section>

      <section className="flex flex-row items-center justify-center pb-2">
        <button
          type="button"
          className={`mx-1 mt-3 h-10 w-20 rounded-2xl font-semibold transition ${
            activeButton === "chat"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
          onClick={() => {
            setActiveButton("chat");
            setSelectedChat(null);
            setSelectedChatUserId(null);
          }}
        >
          Chat
        </button>
        <button
          type="button"
          className={`mx-1 mt-3 h-10 w-20 rounded-2xl font-semibold transition ${
            activeButton === "groups"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
          onClick={() => {
            setActiveButton("groups");
            setSelectedChat(null);
            setSelectedChatUserId(null);
          }}
        >
          Skupiny
        </button>
      </section>

      <section className="flex min-h-110 w-1/3 self-center rounded-3xl shadow-md">
        {!signedIn && (
          <div className="flex w-full flex-col items-center justify-center rounded-3xl bg-white p-6 text-center">
            <h3 className="text-lg font-bold text-slate-900">
              Prihlás sa pre chat
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Po prihlásení uvidíš kontakty, skupiny a správy.
            </p>
          </div>
        )}

        {signedIn && activeButton === "chat" && selectedChat === null && (
          <div className="flex w-full flex-col">
            <div className="relative flex h-11 w-full items-center justify-center rounded-t-3xl bg-blue-600">
              <div className="flex h-8 w-40 rounded-3xl border border-slate-200 bg-white">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center"
                >
                  <IoIosSearch size={20} className="ml-0.5" />
                </button>
                <input
                  type="text"
                  value={search}
                  placeholder="Vyhľadaj ľudí..."
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
              refreshKey={chatListRefreshKey}
              readAtByChatId={readAtByChatId}
              onSelectUser={openDirectChat}
              onSelectBot={() => {
                setSelectedChatName("Chat bot");
                setSelectedChatUserId(null);
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
          <GroupsPanel
            refreshKey={chatListRefreshKey}
            readAtByChatId={readAtByChatId}
            onSelectGroup={openGroupChat}
          />
        )}

        {signedIn && activeButton === "chat" && selectedChat === "bot" && (
          <ChatWindow chatType="bot" goBack={() => setSelectedChat(null)} />
        )}

        {activeButton === "chat" &&
          signedIn &&
          selectedChat !== null &&
          selectedChat !== "bot" && (
            <ChatWindow
              chatType="user"
              chatId={selectedChat}
              chatName={selectedChatName}
              chatProfileUserId={selectedChatUserId}
              onChatRead={handleChatRead}
              goBack={() => {
                setSelectedChat(null);
                setSelectedChatUserId(null);
              }}
            />
          )}
      </section>
    </main>
  );
}
