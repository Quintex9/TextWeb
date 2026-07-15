import { supabase } from "./supabase"

export const createDirectChat = async (targetUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null;

    const { data: chat, error: chatError } = await supabase
        .from("chats")
        .insert({
            created_by: user.id,
            is_group: false,
        })
        .select("id")
        .single()

    if (chatError) {
        console.log(chatError.message)
        return null;
    }

    const { error: membersError } = await supabase
        .from("chat_members")
        .insert([
            {
                chat_id: chat.id,
                user_id: user.id
            },
            {
                chat_id: chat.id,
                user_id: targetUserId
            }])

    if (membersError) {
        console.log(membersError.message)
        return null;
    }

    return chat.id;
}

export const getMyChats = async () => {
    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) return [];

    const { data, error } = await supabase.from("chat_members")
        .select(`chat_id,
            chats (
            id,
            name,
            is_group,
            created_at
            )
            `)
        .eq("user_id", user.id)

    if (error){
        console.log(error.message)
        return [];
    }

    return data;
}

