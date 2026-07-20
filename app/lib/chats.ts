import { supabase } from "./supabase";

export const getOrCreateDirectChat = async (
  targetUserId: string,
): Promise<string | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Moje členstvá iba v direct chatoch
  const { data: myDirectChats, error: myChatsError } = await supabase
    .from("chat_members")
    .select(`
      chat_id,
      chats!inner (
        id,
        is_group
      )
    `)
    .eq("user_id", user.id)
    .eq("chats.is_group", false);

  if (myChatsError) {
    console.log(myChatsError.message);
    return null;
  }

  const directChatIds = myDirectChats.map((item) => item.chat_id);

  // Zistíme, či je target user v niektorom z mojich direct chatov
  if (directChatIds.length > 0) {
    const { data: existingChat, error: existingChatError } =
      await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", targetUserId)
        .in("chat_id", directChatIds)
        .limit(1)
        .maybeSingle();

    if (existingChatError) {
      console.log(existingChatError.message);
      return null;
    }

    if (existingChat) {
      return existingChat.chat_id;
    }
  }

  // Chat neexistuje, vytvoríme nový
  const { data: newChat, error: newChatError } = await supabase
    .from("chats")
    .insert({
      created_by: user.id,
      is_group: false,
    })
    .select("id")
    .single();

  if (newChatError) {
    console.log(newChatError.message);
    return null;
  }

  // Pridáme oboch členov
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
    return null;
  }

  return newChat.id;
};

export const getMyChats = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("chat_members")
    .select(`
      chat_id,
      chats (
        id,
        name,
        is_group,
        created_at,
        created_by
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    console.log(error.message);
    return [];
  }

  return data;
};