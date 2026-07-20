import { supabase } from "./supabase";

export type FollowContact = {
    id: string;
    username: string;
    avatar_url: string | null;
};

type FollowPair = {
    follower_id: string;
    following_id: string;
};

export const sendFollowRequest = async (
    targetUserId: string,
): Promise<boolean> => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    if (user.id === targetUserId) return false;

    // Najprv skontrolujeme, či už medzi používateľmi existuje follow riadok
    const { data: existingFollow, error: findError } = await supabase
        .from("follows")
        .select(`
      id,
      follower_id,
      following_id,
      status
    `)
        .or(
            `and(follower_id.eq.${user.id},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${user.id})`,
        )
        .maybeSingle();

    if (findError) {
        console.log(findError.message);
        return false;
    }

    if (existingFollow) {
        // Druhý používateľ už poslal request mne
        if (
            existingFollow.follower_id === targetUserId &&
            existingFollow.following_id === user.id &&
            existingFollow.status === "pending"
        ) {
            const { error: acceptError } = await supabase
                .from("follows")
                .update({
                    status: "accepted",
                    accepted_at: new Date().toISOString(),
                })
                .eq("id", existingFollow.id)
                .eq("following_id", user.id)
                .eq("status", "pending");

            if (acceptError) {
                console.log(acceptError.message);
                return false;
            }

            return true;
        }

        // Ja som už request poslal
        if (
            existingFollow.follower_id === user.id &&
            existingFollow.following_id === targetUserId &&
            existingFollow.status === "pending"
        ) {
            console.log("Follow request už bol odoslaný.");
            return true;
        }

        // Už ste prepojení
        if (existingFollow.status === "accepted") {
            console.log("Používatelia už majú prijatý follow vzťah.");
            return true;
        }

        return false;
    }

    // Medzi používateľmi zatiaľ nič neexistuje
    const { error: insertError } = await supabase
        .from("follows")
        .insert({
            follower_id: user.id,
            following_id: targetUserId,
            status: "pending",
        });

    if (insertError) {
        console.log(insertError.message);
        return false;
    }

    return true;
};

export const acceptFollowRequest = async (
    followId: string,
): Promise<boolean> => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
        .from("follows")
        .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
        })
        .eq("id", followId)
        .eq("following_id", user.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

    if (error) {
        console.log(error.message);
        return false;
    }

    return !!data;
};

export const rejectFollowRequest = async (
    followId: string,
): Promise<boolean> => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { error } = await supabase
        .from("follows")
        .delete()
        .eq("id", followId)
        .eq("following_id", user.id)
        .eq("status", "pending");

    if (error) {
        console.log(error.message);
        return false;
    }

    return true;
};

export const getFollowRequests = async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("follows")
        .select(`
      id,
      follower_id,
      following_id,
      status,
      created_at,
      follower:profiles!follows_follower_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
        .eq("following_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) {
        console.log(error.message);
        return [];
    }

    return data;
};

export const getAcceptedContacts = async (): Promise<FollowContact[]> => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("follower_id, following_id")
        .eq("status", "accepted")
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

    if (followsError) {
        console.log(followsError.message);
        return [];
    }

    const contactIds = Array.from(
        new Set(
            (follows ?? []).map((follow) =>
                follow.follower_id === user.id
                    ? follow.following_id
                    : follow.follower_id,
            ),
        ),
    );

    if (contactIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", contactIds)
        .order("username");

    if (profilesError) {
        console.log(profilesError.message);
        return [];
    }

    return profiles ?? [];
};

export const hasAcceptedFollowRelationship = async (
    targetUserId: string,
): Promise<boolean> => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;
    if (user.id === targetUserId) return false;

    const { data, error } = await supabase
        .from("follows")
        .select("follower_id, following_id")
        .eq("status", "accepted")
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

    if (error) {
        console.log(error.message);
        return false;
    }

    return ((data ?? []) as FollowPair[]).some(
        (follow) =>
            (follow.follower_id === user.id &&
                follow.following_id === targetUserId) ||
            (follow.follower_id === targetUserId &&
                follow.following_id === user.id),
    );
};

export const getAcceptedContactsCount = async (
    userId: string,
): Promise<number> => {
    const { count, error } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

    if (error) {
        console.log(error.message);
        return 0;
    }

    return count ?? 0;
};

export const getPendingFollowRequestsCount = async (
    userId: string,
): Promise<number> => {
    const { count, error } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId)
        .eq("status", "pending");

    if (error) {
        console.log(error.message);
        return 0;
    }

    return count ?? 0;
};
