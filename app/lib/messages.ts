import { supabase } from "./supabase"

export const sendMessage = async (chatId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("messages")
        .insert({
            chat_id: chatId,
            sender_id: user.id,
            content,
        });

    if (error) {
        console.log(error.message);
    }
}

export const getMessages = async (chatId: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      content,
      created_at,
      sender_id,
    `)
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    console.log(error.message);
    return [];
  }

  return data;
};