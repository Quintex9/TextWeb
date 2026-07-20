"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { IoAddOutline, IoChevronDown, IoPeopleOutline } from "react-icons/io5";
import { createGroupChat, getMyChats, type MyChat } from "../lib/chats";
import { getAcceptedContacts, type FollowContact } from "../lib/follows";

type GroupsPanelProps = {
  onSelectGroup: (chatId: string, chatName: string) => void;
};

export default function GroupsPanel({ onSelectGroup }: GroupsPanelProps) {
  const [groupName, setGroupName] = useState("");
  const [contacts, setContacts] = useState<FollowContact[]>([]);
  const [groups, setGroups] = useState<MyChat[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [loadedContacts, loadedChats] = await Promise.all([
      getAcceptedContacts(),
      getMyChats(),
    ]);

    setContacts(loadedContacts);
    setGroups(loadedChats.filter((chat) => chat.isGroup));
    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((currentIds) =>
      currentIds.includes(memberId)
        ? currentIds.filter((id) => id !== memberId)
        : [...currentIds, memberId],
    );
  };

  const handleCreateGroup = async () => {
    setMessage(null);
    setCreating(true);

    const chatId = await createGroupChat({
      name: groupName,
      memberIds: selectedMemberIds,
    });

    setCreating(false);

    if (!chatId) {
      setMessage("Skupinu sa nepodarilo vytvorit.");
      return;
    }

    const cleanName = groupName.trim();
    setGroupName("");
    setSelectedMemberIds([]);
    setMessage("Skupina bola vytvorena.");
    setShowCreateForm(false);
    await loadData();
    onSelectGroup(chatId, cleanName);
  };

  return (
    <div className="flex w-full flex-col">
      <div className="flex h-11 w-full items-center justify-center rounded-t-3xl bg-blue-400 text-white">
        <IoPeopleOutline size={22} />
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowCreateForm((isOpen) => !isOpen)}
            className="flex h-12 w-full items-center gap-3 px-3 text-left hover:bg-stone-50"
            aria-expanded={showCreateForm}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <IoAddOutline size={22} />
            </span>
            <span className="min-w-0 flex-1 font-semibold text-stone-800">
              Vytvorit skupinu
            </span>
            <IoChevronDown
              size={20}
              className={`text-stone-500 transition ${showCreateForm ? "rotate-180" : ""
                }`}
            />
          </button>

          {showCreateForm && (
            <div className="border-t border-stone-100 p-3">
              <input
                type="text"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Nazov skupiny"
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-blue-500"
              />

              <div className="mt-3 flex max-h-36 flex-col gap-2 overflow-y-auto">
                {loading && (
                  <p className="text-sm text-stone-500">Nacitavam kontakty...</p>
                )}

                {!loading && contacts.length === 0 && (
                  <p className="text-sm text-stone-500">
                    Najprv potrebujes prijate follow kontakty.
                  </p>
                )}

                {!loading &&
                  contacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-stone-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(contact.id)}
                        onChange={() => toggleMember(contact.id)}
                        className="h-4 w-4"
                      />
                      <Image
                        src={contact.avatar_url ?? "/chat/placeholder.svg"}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <span className="truncate text-sm font-semibold text-stone-800">
                        {contact.username}
                      </span>
                    </label>
                  ))}
              </div>

              <button
                type="button"
                disabled={creating}
                onClick={handleCreateGroup}
                className="mt-3 h-10 w-full rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:bg-stone-400"
              >
                {creating ? "Vytvaram..." : "Vytvorit"}
              </button>
            </div>
          )}
        </div>

        {message && (
          <p className="text-center text-sm text-stone-500">{message}</p>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-stone-800">Moje skupiny</h2>

          {!loading && groups.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-center text-sm text-stone-500">
              Zatial nemas ziadnu skupinu.
            </p>
          )}

          {groups.map((group) => (
            <button
              key={group.chatId}
              type="button"
              onClick={() =>
                onSelectGroup(group.chatId, group.chatName ?? "Skupina")
              }
              className="flex items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm hover:bg-stone-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <IoPeopleOutline size={22} />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-800">
                  {group.chatName ?? "Skupina"}
                </p>
                <p className="truncate text-sm text-stone-500">
                  {group.lastMessage ?? "Bez sprav"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
