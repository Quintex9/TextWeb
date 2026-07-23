import { hasAcceptedFollowRelationship } from "./follows";
import { supabase } from "./supabase";

export type MyChat = {
  chatId: string;
  isGroup: boolean;
  chatName: string | null;
  otherUserId: string | null;
  username: string | null;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastMessageSenderId: string | null;
  lastMessageSenderName: string | null;
  lastMessageIsMine: boolean;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
};

type ChatRow = {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  created_by: string;
};

type ChatMemberRow = {
  chat_id: string;
  user_id: string;
  last_read_at: string | null;
};

type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type MessageRow = {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

/**
 * Nájde existujúci direct chat alebo vytvorí nový.
 * Chat môže vzniknúť iba medzi používateľmi
 * s prijatým follow vzťahom.
 */
export const getOrCreateDirectChat = async (
  targetUserId: string,
): Promise<string | null> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.log(userError.message);
    return null;
  }

  if (!user) {
    console.log("Používateľ nie je prihlásený.");
    return null;
  }

  if (user.id === targetUserId) {
    console.log("Nemôžeš vytvoriť chat sám so sebou.");
    return null;
  }

  /*
   * 1. Skontrolujeme, či majú používatelia
   * prijatý follow vzťah v jednom alebo druhom smere.
   */
  const hasAcceptedFollow = await hasAcceptedFollowRelationship(targetUserId);

  if (!hasAcceptedFollow) {
    console.log(
      "Chat je možné vytvoriť až po prijatí follow žiadosti.",
    );

    return null;
  }

  /*
   * 2. Načítame všetky direct chaty,
   * ktorých členom je prihlásený používateľ.
   */
  const { data: myMemberships, error: membershipsError } =
    await supabase
      .from("chat_members")
      .select("chat_id, last_read_at")
      .eq("user_id", user.id);

  if (membershipsError) {
    console.log(membershipsError.message);
    return null;
  }

  const myChatIds =
    myMemberships?.map((membership) => membership.chat_id) ?? [];

  if (myChatIds.length > 0) {
    const { data: directChats, error: directChatsError } =
      await supabase
        .from("chats")
        .select("id")
        .in("id", myChatIds)
        .eq("is_group", false);

    if (directChatsError) {
      console.log(directChatsError.message);
      return null;
    }

    const directChatIds =
      directChats?.map((chat) => chat.id) ?? [];

    /*
     * 3. Skontrolujeme, či je target používateľ
     * členom niektorého z mojich direct chatov.
     */
    if (directChatIds.length > 0) {
      const { data: existingMembership, error: existingError } =
        await supabase
          .from("chat_members")
          .select("chat_id")
          .eq("user_id", targetUserId)
          .in("chat_id", directChatIds)
          .limit(1)
          .maybeSingle();

      if (existingError) {
        console.log(existingError.message);
        return null;
      }

      if (existingMembership) {
        return existingMembership.chat_id;
      }
    }
  }

  /*
   * 4. Spoločný direct chat neexistuje,
   * preto vytvoríme nový.
   */
  const { data: newChat, error: newChatError } = await supabase
    .from("chats")
    .insert({
      created_by: user.id,
      is_group: false,
      name: null,
    })
    .select("id")
    .single();

  if (newChatError) {
    console.log(newChatError.message);
    return null;
  }

  /*
   * 5. Do chatu pridáme oboch používateľov.
   */
  const { error: membersError } = await supabase
    .from("chat_members")
    .insert([
      {
        chat_id: newChat.id,
        user_id: user.id,
      },
      {
        chat_id: newChat.id,
        user_id: targetUserId,
      },
    ]);

  if (membersError) {
    console.log(membersError.message);

    // Odstránenie prázdneho chatu, ak vloženie členov zlyhá.
    await supabase
      .from("chats")
      .delete()
      .eq("id", newChat.id);

    return null;
  }

  return newChat.id;
};

/**
 * Načíta všetky chaty prihláseného používateľa.
 *
 * Pri direct chate doplní profil druhého používateľa.
 * Pri každom chate doplní poslednú správu.
 */
export const getMyChats = async (): Promise<MyChat[]> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.log(userError.message);
    return [];
  }

  if (!user) return [];

  /*
   * 1. Načítame členstvá aktuálneho používateľa.
   */
  const { data: myMemberships, error: membershipsError } =
    await supabase
      .from("chat_members")
      .select("chat_id, last_read_at")
      .eq("user_id", user.id);

  if (membershipsError) {
    console.log(membershipsError.message);
    return [];
  }

  const chatIds =
    myMemberships?.map((membership) => membership.chat_id) ?? [];

  if (chatIds.length === 0) {
    return [];
  }

  /*
   * 2. Načítame samotné chaty.
   */
  const { data: chatsData, error: chatsError } = await supabase
    .from("chats")
    .select(`
      id,
      name,
      is_group,
      created_at,
      created_by
    `)
    .in("id", chatIds);

  if (chatsError) {
    console.log(chatsError.message);
    return [];
  }

  const chats = (chatsData ?? []) as ChatRow[];

  /*
   * 3. Načítame všetkých členov týchto chatov.
   * Pri direct chate tak nájdeme druhého používateľa.
   */
  const { data: membersData, error: membersError } =
    await supabase
      .from("chat_members")
      .select("chat_id, user_id, last_read_at")
      .in("chat_id", chatIds);

  if (membersError) {
    console.log(membersError.message);
    return [];
  }

  const members = (membersData ?? []) as ChatMemberRow[];

  /*
   * ID ostatných používateľov.
   */
  const otherUserIds = Array.from(
    new Set(
      members
        .filter((member) => member.user_id !== user.id)
        .map((member) => member.user_id),
    ),
  );

  /*
   * 4. Načítame profily ostatných používateľov.
   */
  let profiles: ProfileRow[] = [];

  if (otherUserIds.length > 0) {
    const { data: profilesData, error: profilesError } =
      await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", otherUserIds);

    if (profilesError) {
      console.log(profilesError.message);
      return [];
    }

    profiles = (profilesData ?? []) as ProfileRow[];
  }

  /*
   * 5. Načítame správy od najnovšej.
   *
   * Prvá nájdená správa každého chatu
   * bude jeho posledná správa.
   */
  const { data: messagesData, error: messagesError } =
    await supabase
      .from("messages")
      .select(`
        id,
        chat_id,
        user_id,
        content,
        created_at
      `)
      .in("chat_id", chatIds)
      .order("created_at", { ascending: false });

  if (messagesError) {
    console.log(messagesError.message);
    return [];
  }

  const messages = (messagesData ?? []) as MessageRow[];

  /*
   * Mapy zrýchlia vyhľadávanie profilov
   * a posledných správ.
   */
  const profilesById = new Map(
    profiles.map((profile) => [profile.id, profile]),
  );

  const myMembershipByChatId = new Map(
    ((myMemberships ?? []) as ChatMemberRow[]).map((membership) => [
      membership.chat_id,
      membership,
    ]),
  );

  const lastMessageByChatId = new Map<string, MessageRow>();

  for (const message of messages) {
    if (!lastMessageByChatId.has(message.chat_id)) {
      lastMessageByChatId.set(message.chat_id, message);
    }
  }

  /*
   * 6. Vytvoríme výsledok vhodný priamo pre ChatList.
   */
  const result: MyChat[] = chats.map((chat) => {
    const chatMembers = members.filter(
      (member) => member.chat_id === chat.id,
    );

    const otherMember = chat.is_group
      ? null
      : chatMembers.find(
        (member) => member.user_id !== user.id,
      ) ?? null;

    const otherProfile = otherMember
      ? profilesById.get(otherMember.user_id) ?? null
      : null;

    const lastMessage =
      lastMessageByChatId.get(chat.id) ?? null;
    const myMembership = myMembershipByChatId.get(chat.id) ?? null;
    const lastReadAt = myMembership?.last_read_at
      ? new Date(myMembership.last_read_at).getTime()
      : 0;
    const unreadCount = messages.filter(
      (message) =>
        message.chat_id === chat.id &&
        message.user_id !== user.id &&
        new Date(message.created_at).getTime() > lastReadAt,
    ).length;

    return {
      chatId: chat.id,
      isGroup: chat.is_group,

      // Pri skupine názov skupiny, pri direct chate username.
      chatName: chat.is_group
        ? chat.name
        : otherProfile?.username ?? null,

      otherUserId: otherProfile?.id ?? null,
      username: otherProfile?.username ?? null,
      avatarUrl: otherProfile?.avatar_url ?? null,

      lastMessage: lastMessage?.content ?? null,
      lastMessageSenderId: lastMessage?.user_id ?? null,
      lastMessageSenderName: lastMessage
        ? lastMessage.user_id === user.id
          ? "Ja"
          : profilesById.get(lastMessage.user_id)?.username ?? "Používateľ"
        : null,
      lastMessageIsMine: lastMessage?.user_id === user.id,
      lastMessageAt: lastMessage?.created_at ?? null,
      unreadCount,

      createdAt: chat.created_at,
    };
  });

  /*
   * Chat s najnovšou správou bude prvý.
   * Chat bez správy sa zoradí podľa dátumu vytvorenia.
   */
  return result.sort((firstChat, secondChat) => {
    const firstDate =
      firstChat.lastMessageAt ?? firstChat.createdAt;

    const secondDate =
      secondChat.lastMessageAt ?? secondChat.createdAt;

    return (
      new Date(secondDate).getTime() -
      new Date(firstDate).getTime()
    );
  });
};

export type CreateGroupChatInput = {
  name: string;
  memberIds: string[];
};

export const createGroupChat = async ({
  name,
  memberIds,
}: CreateGroupChatInput): Promise<string | null> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.log(userError.message);
    return null;
  }

  if (!user) {
    console.log("Používateľ nie je prihlásený.");
    return null;
  }

  const cleanName = name.trim();

  if (cleanName.length < 3) {
    console.log("Názov skupiny musí mať aspoň 3 znaky.");
    return null;
  }

  if (cleanName.length > 50) {
    console.log("Názov skupiny môže mať maximálne 50 znakov.");
    return null;
  }

  const uniqueMemberIds = Array.from(
    new Set(
      memberIds.filter(
        (memberId) =>
          memberId &&
          memberId !== user.id,
      ),
    ),
  );

  if (uniqueMemberIds.length === 0) {
    console.log("Vyber aspoň jedného člena skupiny.");
    return null;
  }

  /*
   * Overíme, že vybraní používatelia sú prijaté kontakty.
   */
  const { data: acceptedFollows, error: followsError } =
    await supabase
      .from("follows")
      .select("follower_id, following_id")
      .eq("status", "accepted")
      .or(
        `follower_id.eq.${user.id},following_id.eq.${user.id}`,
      );

  if (followsError) {
    console.log(followsError.message);
    return null;
  }

  const acceptedContactIds = new Set(
    (acceptedFollows ?? []).map((follow) =>
      follow.follower_id === user.id
        ? follow.following_id
        : follow.follower_id,
    ),
  );

  const invalidMember = uniqueMemberIds.find(
    (memberId) => !acceptedContactIds.has(memberId),
  );

  if (invalidMember) {
    console.log(
      "Do skupiny môžeš pridať iba prijaté kontakty.",
    );
    return null;
  }

  /*
   * Vytvorenie skupinového chatu.
   */
  const { data: newGroup, error: groupError } =
    await supabase
      .from("chats")
      .insert({
        name: cleanName,
        is_group: true,
        created_by: user.id,
      })
      .select("id")
      .single();

  if (groupError) {
    console.log(groupError.message);
    return null;
  }

  /*
   * Zakladateľ + vybraní členovia.
   */
  const allMemberIds = [
    user.id,
    ...uniqueMemberIds,
  ];

  const membersToInsert = allMemberIds.map(
    (memberId) => ({
      chat_id: newGroup.id,
      user_id: memberId,
    }),
  );

  const { error: membersError } = await supabase
    .from("chat_members")
    .insert(membersToInsert);

  if (membersError) {
    console.log(membersError.message);

    await supabase
      .from("chats")
      .delete()
      .eq("id", newGroup.id);

    return null;
  }

  return newGroup.id;
};

export const markChatAsRead = async (chatId: string): Promise<boolean> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.log(userError.message);
    return false;
  }

  if (!user) return false;

  const { data, error } = await supabase
    .from("chat_members")
    .update({
      last_read_at: new Date().toISOString(),
    })
    .eq("chat_id", chatId)
    .eq("user_id", user.id)
    .select("chat_id, last_read_at")
    .maybeSingle();

  if (error) { 
    console.log(error.message);
    return false;
  }

  if (!data) {
    console.log("Chat sa nepodarilo označiť ako prečítaný.");
    return false;
  }

  return true;
};

export type GroupMember = {
  id: string;
  username: string;
  avatar_url: string | null;
  isCurrentUser: boolean;
};

export const getGroupMembers = async (
  chatId: string,
): Promise<GroupMember[]> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.log(userError.message);
    return [];
  }

  if (!user) return [];

  const { data: membersData, error: membersError } = await supabase
    .from("chat_members")
    .select("user_id")
    .eq("chat_id", chatId);

  if (membersError) {
    console.log(membersError.message);
    return [];
  }

  const memberIds = (membersData ?? []).map((member) => member.user_id);

  if (!memberIds.includes(user.id)) return [];
  if (memberIds.length === 0) return [];

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", memberIds);

  if (profilesError) {
    console.log(profilesError.message);
    return [];
  }

  const profilesById = new Map(
    ((profilesData ?? []) as ProfileRow[]).map((profile) => [
      profile.id,
      profile,
    ]),
  );

  return memberIds
    .map((memberId) => profilesById.get(memberId) ?? null)
    .filter((profile): profile is ProfileRow => profile !== null)
    .map((profile) => ({
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      isCurrentUser: profile.id === user.id,
    }))
    .sort((firstMember, secondMember) => {
      if (firstMember.isCurrentUser) return -1;
      if (secondMember.isCurrentUser) return 1;
      return firstMember.username.localeCompare(secondMember.username);
    });
};

export const addGroupMembers = async (
  chatId: string,
  memberIds: string[],
): Promise<boolean> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.log(userError.message);
    return false;
  }

  if (!user) return false;

  const uniqueMemberIds = Array.from(
    new Set(memberIds.filter((memberId) => memberId && memberId !== user.id)),
  );

  if (uniqueMemberIds.length === 0) return false;

  const { data: chatData, error: chatError } = await supabase
    .from("chats")
    .select("id, is_group")
    .eq("id", chatId)
    .eq("is_group", true)
    .maybeSingle();

  if (chatError) {
    console.log(chatError.message);
    return false;
  }

  if (!chatData) return false;

  const { data: existingMembers, error: membersError } = await supabase
    .from("chat_members")
    .select("user_id")
    .eq("chat_id", chatId);

  if (membersError) {
    console.log(membersError.message);
    return false;
  }

  const existingMemberIds = new Set(
    (existingMembers ?? []).map((member) => member.user_id),
  );

  if (!existingMemberIds.has(user.id)) return false;

  const { data: acceptedFollows, error: followsError } = await supabase
    .from("follows")
    .select("follower_id, following_id")
    .eq("status", "accepted")
    .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

  if (followsError) {
    console.log(followsError.message);
    return false;
  }

  const acceptedContactIds = new Set(
    (acceptedFollows ?? []).map((follow) =>
      follow.follower_id === user.id
        ? follow.following_id
        : follow.follower_id,
    ),
  );

  const memberIdsToInsert = uniqueMemberIds.filter(
    (memberId) =>
      !existingMemberIds.has(memberId) && acceptedContactIds.has(memberId),
  );

  if (memberIdsToInsert.length === 0) return false;

  const { error: insertError } = await supabase.from("chat_members").insert(
    memberIdsToInsert.map((memberId) => ({
      chat_id: chatId,
      user_id: memberId,
    })),
  );

  if (insertError) {
    console.log(insertError.message);
    return false;
  }

  return true;
};

export const leaveGroupChat = async (chatId: string): Promise<boolean> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.log(userError.message);
    return false;
  }

  if (!user) return false;

  const { error } = await supabase
    .from("chat_members")
    .delete()
    .eq("chat_id", chatId)
    .eq("user_id", user.id);

  if (error) {
    console.log(error.message);
    return false;
  }

  return true;
};
