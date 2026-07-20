"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";
import { getUsers } from "../lib/users";
import { sendFollowRequest } from "../lib/follows";
import Link from "next/link";

type Profile = {
    id: string;
    username: string;
};

type UsersSearchPopupProps = {
    search: string;
    onClose: () => void;
};

export default function UsersSearchPopup({
    search,
    onClose,
}: UsersSearchPopupProps) {
    const [users, setUsers] = useState<Profile[]>([]);
    const [randomUsers, setRandomUsers] = useState<Profile[]>([]);
    const [sentRequests, setSentRequests] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    useEffect(() => {
        const loadUsers = async () => {
            const data = await getUsers();

            setUsers(data);

            const shuffledUsers = [...data].sort(() => Math.random() - 0.5);
            const maximumCount = Math.min(5, shuffledUsers.length);

            if (maximumCount > 0) {
                const randomCount =
                    Math.floor(Math.random() * maximumCount) + 1;

                setRandomUsers(shuffledUsers.slice(0, randomCount));
            }

            setLoading(false);
        };

        loadUsers();
    }, []);

    const displayedUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return randomUsers;
        }

        return users
            .filter((user) =>
                user.username.toLowerCase().includes(normalizedSearch),
            )
            .slice(0, 5);
    }, [search, users, randomUsers]);

    const handleFollow = async (userId: string) => {
        await sendFollowRequest(userId);

        setSentRequests((previousRequests) => [
            ...previousRequests,
            userId,
        ]);
    };

    return (
        <div className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-xl">
            <div className="max-h-72 overflow-y-auto p-2">
                {loading && (
                    <p className="p-3 text-center text-sm text-stone-500">
                        Načítavam...
                    </p>
                )}

                {!loading && displayedUsers.length === 0 && (
                    <p className="p-3 text-center text-sm text-stone-500">
                        Používateľ sa nenašiel.
                    </p>
                )}

                {!loading &&
                    displayedUsers.map((user) => {
                        const requestSent = sentRequests.includes(user.id);

                        return (
                            <div
                                ref={searchRef}
                                key={user.id}
                                className="flex items-center gap-3 rounded-xl p-2 hover:bg-stone-100"
                            >
                                <Link
                                    href={`/profile/${user.id}`} 
                                    className="flex min-w-0 flex-1 items-center gap-3"
                                >
                                    <Image
                                        src="/chat/placeholder.svg"
                                        alt="Používateľ"
                                        width={36}
                                        height={36}
                                        className="rounded-full"
                                    />

                                    <span className="min-w-0 flex-1 truncate font-semibold text-stone-800">
                                        {user.username}
                                    </span>
                                </Link>

                                <button
                                    type="button"
                                    disabled={requestSent}
                                    onClick={() => handleFollow(user.id)}
                                    className="rounded-xl bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:bg-stone-400"
                                >
                                    {requestSent ? "Odoslané" : "Follow"}
                                </button>
                            </div>
                        );
                    })}
            </div>

            <button
                type="button"
                onClick={onClose}
                className="w-full border-t border-stone-200 py-2 text-sm text-stone-500 hover:bg-stone-100"
            >
                Zavrieť
            </button>
        </div>
    );
}