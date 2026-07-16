"use client";

import { useEffect, useState } from "react";
import { getUsers } from "../lib/users";
import Image from "next/image";
import { RiRobot2Line } from "react-icons/ri";

type Profile = {
  id: string;
  username: string;
};

type UsersListProps = {
  onSelectUser: (userId: string) => void;
  onSelectBot: (botId: string) => void;
};

export default function UsersList({ onSelectUser, onSelectBot }: UsersListProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);

      const data = await getUsers();

      setUsers(data);
      setLoading(false);
    };

    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center text-stone-500">
        Načítavam používateľov...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-4 text-center text-stone-500">
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
        className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-stone-100"
      >
        <div
          className="w-10 h-10  rounded-full flex justify-center items-center bg-blue-400"
        >
          <RiRobot2Line size={20} />
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-stone-800">
            Chat bot
          </span>

          <span className="text-sm text-stone-500">
            Vyskúšaj si písanie s botom.
          </span>
        </div>
      </button>
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelectUser(user.id)}
          className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-stone-100"
        >
          <Image
            src="/chat/placeholder.svg"
            alt="User placeholder"
            width={40}
            height={40}
            className="rounded-full"
          />

          <div className="flex flex-col">
            <span className="font-semibold text-stone-800">
              {user.username}
            </span>

            <span className="text-sm text-stone-500">
              Klikni pre otvorenie chatu
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}