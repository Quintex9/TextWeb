"use client";

import { useEffect, useState } from "react";
import { getUsers } from "../lib/users";
import Image from "next/image";

type Profile = {
  id: string;
  username: string;
};

type UsersListProps = {
  onSelectUser: (userId: string) => void;
};

export default function UsersList({ onSelectUser }: UsersListProps) {
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