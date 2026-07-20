import { supabase } from "./supabase";

export type Message = {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export const sendMessage = async (
  chatId: string,
  content: string,
): Promise<Message | null> => {
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

  const trimmedContent = content.trim();

  if (!trimmedContent) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      user_id: user.id,
      content: trimmedContent,
    })
    .select(`
      id,
      chat_id,
      user_id,
      content,
      created_at
    `)
    .single();

  if (error) {
    console.log(error.message);
    return null;
  }

  return data;
};

export const getMessages = async (
  chatId: string,
): Promise<Message[]> => {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      chat_id,
      user_id,
      content,
      created_at
    `)
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    console.log(error.message);
    return [];
  }

  return data ?? [];
};