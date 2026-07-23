"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  IoAddOutline,
  IoChevronDown,
  IoExitOutline,
  IoInformationCircleOutline,
  IoPeopleOutline,
  IoPersonAddOutline,
} from "react-icons/io5";
import {
  addGroupMembers,
  createGroupChat,
  getGroupMembers,
  getMyChats,
  leaveGroupChat,
  type GroupMember,
  type MyChat,
} from "../lib/chats";
import { getAcceptedContacts, type FollowContact } from "../lib/follows";

type GroupsPanelProps = {
  onSelectGroup: (chatId: string, chatName: string) => void;
  refreshKey?: number;
  readAtByChatId?: Record<string, string>;
};

export default function GroupsPanel({
  onSelectGroup,
  refreshKey = 0,
  readAtByChatId = {},
}: GroupsPanelProps) {
  const [groupName, setGroupName] = useState("");
  const [contacts, setContacts] = useState<FollowContact[]>([]);
  const [groups, setGroups] = useState<MyChat[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedAddMemberIds, setSelectedAddMemberIds] = useState<string[]>(
    [],
  );
  const [selectedDetailGroupId, setSelectedDetailGroupId] = useState<
    string | null
  >(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
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

  const loadGroupDetail = async (chatId: string) => {
    setDetailLoading(true);
    setSelectedAddMemberIds([]);
    const members = await getGroupMembers(chatId);
    setGroupMembers(members);
    setDetailLoading(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshKey]);

  const selectedDetailGroup = useMemo(
    () =>
      groups.find((group) => group.chatId === selectedDetailGroupId) ?? null,
    [groups, selectedDetailGroupId],
  );

  const availableContactsToAdd = useMemo(() => {
    const memberIds = new Set(groupMembers.map((member) => member.id));

    return contacts.filter((contact) => !memberIds.has(contact.id));
  }, [contacts, groupMembers]);

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((currentIds) =>
      currentIds.includes(memberId)
        ? currentIds.filter((id) => id !== memberId)
        : [...currentIds, memberId],
    );
  };

  const toggleAddMember = (memberId: string) => {
    setSelectedAddMemberIds((currentIds) =>
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
      setMessage("Skupinu sa nepodarilo vytvoriť.");
      return;
    }

    const cleanName = groupName.trim();
    setGroupName("");
    setSelectedMemberIds([]);
    setMessage("Skupina bola vytvorená.");
    setShowCreateForm(false);
    await loadData();
    onSelectGroup(chatId, cleanName);
  };

  const handleToggleDetail = async (chatId: string) => {
    setMessage(null);

    if (selectedDetailGroupId === chatId) {
      setSelectedDetailGroupId(null);
      setGroupMembers([]);
      setSelectedAddMemberIds([]);
      return;
    }

    setSelectedDetailGroupId(chatId);
    await loadGroupDetail(chatId);
  };

  const handleAddMembers = async () => {
    if (!selectedDetailGroupId || selectedAddMemberIds.length === 0) return;

    setMessage(null);
    setAddingMembers(true);

    const success = await addGroupMembers(
      selectedDetailGroupId,
      selectedAddMemberIds,
    );

    setAddingMembers(false);

    if (!success) {
      setMessage("Členov sa nepodarilo pridať.");
      return;
    }

    setMessage("Členovia boli pridaní.");
    await loadGroupDetail(selectedDetailGroupId);
  };

  const handleLeaveGroup = async () => {
    if (!selectedDetailGroupId) return;

    setMessage(null);
    setLeavingGroup(true);

    const success = await leaveGroupChat(selectedDetailGroupId);

    setLeavingGroup(false);

    if (!success) {
      setMessage("Skupinu sa nepodarilo opustiť.");
      return;
    }

    setMessage("Skupinu si opustil.");
    setSelectedDetailGroupId(null);
    setGroupMembers([]);
    setSelectedAddMemberIds([]);
    await loadData();
  };

  return (
    <div className="flex w-full flex-col">
      <div className="flex h-11 w-full items-center justify-center rounded-t-3xl bg-blue-600 text-white">
        <IoPeopleOutline size={22} />
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowCreateForm((isOpen) => !isOpen)}
            className="flex h-12 w-full items-center gap-3 px-3 text-left hover:bg-slate-50"
            aria-expanded={showCreateForm}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <IoAddOutline size={22} />
            </span>
            <span className="min-w-0 flex-1 font-semibold text-slate-900">
              Vytvoriť skupinu
            </span>
            <IoChevronDown
              size={20}
              className={`text-slate-500 transition ${
                showCreateForm ? "rotate-180" : ""
              }`}
            />
          </button>

          {showCreateForm && (
            <div className="border-t border-slate-100 p-3">
              <input
                type="text"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Názov skupiny"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-600"
              />

              <div className="mt-3 flex max-h-36 flex-col gap-2 overflow-y-auto">
                {loading && (
                  <p className="text-sm text-slate-500">
                    Načítavam kontakty...
                  </p>
                )}

                {!loading && contacts.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Najprv potrebuješ prijaté follow kontakty.
                  </p>
                )}

                {!loading &&
                  contacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(contact.id)}
                        onChange={() => toggleMember(contact.id)}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <Image
                        src={contact.avatar_url ?? "/chat/placeholder.svg"}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {contact.username}
                      </span>
                    </label>
                  ))}
              </div>

              <button
                type="button"
                disabled={creating}
                onClick={handleCreateGroup}
                className="mt-3 h-10 w-full rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
              >
                {creating ? "Vytváram..." : "Vytvoriť"}
              </button>
            </div>
          )}
        </div>

        {message && (
          <p className="rounded-2xl bg-blue-50 px-3 py-2 text-center text-sm text-blue-700">
            {message}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-slate-900">Moje skupiny</h2>

          {!loading && groups.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500">
              Zatiaľ nemáš žiadnu skupinu.
            </p>
          )}

          {groups.map((group) => {
            const isDetailOpen = selectedDetailGroupId === group.chatId;
            const localReadAt = readAtByChatId[group.chatId];
            const isLocallyRead =
              Boolean(localReadAt) &&
              Boolean(group.lastMessageAt) &&
              new Date(localReadAt as string).getTime() >=
                new Date(group.lastMessageAt as string).getTime();
            const unreadCount =
              isLocallyRead || group.lastMessageIsMine
                ? 0
                : group.unreadCount;
            const hasUnread = unreadCount > 0;

            return (
              <div
                key={group.chatId}
                className={`overflow-hidden rounded-2xl shadow-sm ${
                  hasUnread ? "bg-blue-50" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() =>
                      onSelectGroup(group.chatId, group.chatName ?? "Skupina")
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <IoPeopleOutline size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {group.chatName ?? "Skupina"}
                      </p>
                      <p
                        className={`truncate text-sm ${
                          hasUnread
                            ? "font-semibold text-slate-800"
                            : "text-slate-500"
                        }`}
                      >
                        {group.lastMessage ?? "Bez správ"}
                      </p>
                    </div>
                  </button>

                  {hasUnread && (
                    <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleDetail(group.chatId)}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isDetailOpen
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                    aria-label="Detail skupiny"
                  >
                    <IoInformationCircleOutline size={21} />
                  </button>
                </div>

                {isDetailOpen && selectedDetailGroup && (
                  <div className="border-t border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {selectedDetailGroup.chatName ?? "Skupina"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {groupMembers.length} členov
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={leavingGroup}
                        onClick={handleLeaveGroup}
                        className="flex h-9 items-center gap-1 rounded-xl bg-red-50 px-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:text-slate-400"
                      >
                        <IoExitOutline size={18} />
                        Odísť
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {detailLoading && (
                        <p className="text-sm text-slate-500">
                          Načítavam členov...
                        </p>
                      )}

                      {!detailLoading &&
                        groupMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-xl bg-slate-50 p-2"
                          >
                            <Image
                              src={member.avatar_url ?? "/chat/placeholder.svg"}
                              alt=""
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {member.username}
                              </p>
                              {member.isCurrentUser && (
                                <p className="text-xs text-slate-500">Ty</p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-100 p-3">
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <IoPersonAddOutline
                          size={18}
                          className="text-blue-600"
                        />
                        Pridať členov
                      </div>

                      <div className="mt-2 flex max-h-32 flex-col gap-2 overflow-y-auto">
                        {availableContactsToAdd.length === 0 && (
                          <p className="text-sm text-slate-500">
                            Nemáš ďalšie kontakty na pridanie.
                          </p>
                        )}

                        {availableContactsToAdd.map((contact) => (
                          <label
                            key={contact.id}
                            className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAddMemberIds.includes(
                                contact.id,
                              )}
                              onChange={() => toggleAddMember(contact.id)}
                              className="h-4 w-4 accent-blue-600"
                            />
                            <Image
                              src={
                                contact.avatar_url ?? "/chat/placeholder.svg"
                              }
                              alt=""
                              width={28}
                              height={28}
                              className="rounded-full"
                            />
                            <span className="truncate text-sm font-semibold text-slate-900">
                              {contact.username}
                            </span>
                          </label>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={
                          addingMembers || selectedAddMemberIds.length === 0
                        }
                        onClick={handleAddMembers}
                        className="mt-3 h-9 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
                      >
                        {addingMembers ? "Pridávam..." : "Pridať do skupiny"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
