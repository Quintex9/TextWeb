import { supabase } from "./supabase";

export const sendFollowRequest = async (targetUserId: string) => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: targetUserId,
        status: "pending",
        created_at: new Date().toISOString(),
    });

    if (error) {
        console.log(error.message);
    }
}

export const acceptFollowRequest = async (followId: string) => {

    const { error } = await supabase.from("follows")
        .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
        })
        .eq("id", followId);

    if (error) {
        console.log(error.message);
    }
};

export const getFollowRequests = async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase.from("follows")
        .select("id, following_id, status")
        .eq("following_id", user.id)
        .eq("status", "pending");

    if (error) {
        console.log(error.message);
        return [];
    }

    return data;

}