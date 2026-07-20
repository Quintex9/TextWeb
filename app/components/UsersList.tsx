"use client";

import { useEffect, useState } from "react";
import { getUsers } from "../lib/users";
import Image from "next/image";
import { RiRobot2Line } from "react-icons/ri";
import { getMyChats, type MyChat } from "../lib/chats";
import { useOnlineUsers } from "../lib/useOnlineUsers";

type Profile = {
  id: string;
  username: string;
};

type UsersListProps = {
  onSelectUser: (userId: string, username: string) => void;
  onSelectBot: (botId: string) => void;
};

export default function UsersList({ onSelectUser, onSelectBot }: UsersListProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [directChats, setDirectChats] = useState<MyChat[]>([]);
  const [loading, setLoading] = useState(true);
  const { isUserOnline } = useOnlineUsers();

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);

      const [usersData, chatsData] = await Promise.all([
        getUsers(),
        getMyChats(),
      ]);

      setUsers(usersData);
      setDirectChats(chatsData.filter((chat) => !chat.isGroup));
      setLoading(false);
    };

    loadUsers();
  }, []);

  const getLastMessagePreviewForUser = (user: Profile) => {
    const directChat = directChats.find(
      (chat) => chat.otherUserId === user.id,
    );

    if (!directChat?.lastMessage) return "Zatiaľ žiadne správy";

    const senderName =
      directChat.lastMessageSenderId === user.id ? user.username : "Ja";

    return `${senderName}: ${directChat.lastMessage}`;
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500">
        Načítavam používateľov...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500">
        Zatiaľ tu nie sú žiadni používatelia.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* Chat bot */}
      <button
        type="button"
        onClick={() => onSelectBot("bot")}
        className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-slate-100"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white"
        >
          <RiRobot2Line size={20} />
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">
            Chat bot
          </span>

          <span className="text-sm text-slate-500">
            Vyskúšaj si písanie s botom.
          </span>
        </div>
      </button>
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelectUser(user.id, user.username)}
          className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-slate-100"
        >
          <div className="relative h-10 w-10 shrink-0">
            <Image
              src="/chat/placeholder.svg"
              alt=""
              width={40}
              height={40}
              className="rounded-full"
            />
            {isUserOnline(user.id) && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-100 bg-green-500" />
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold text-slate-900">
                {user.username}
              </span>
              <span
                className={`shrink-0 text-xs ${isUserOnline(user.id) ? "text-green-600" : "text-slate-400"
                  }`}
              >
                {isUserOnline(user.id) ? "Online" : "Offline"}
              </span>
            </div>

            <span className="truncate text-sm text-slate-500">
              {getLastMessagePreviewForUser(user)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
