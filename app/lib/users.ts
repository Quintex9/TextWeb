import { supabase } from "./supabase";

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  bio: string | null;
};

export type ProfileSettings = {
  id: string;
  user_id: string;
  is_profile_public: boolean;
  show_online_status: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export const getUsers = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .neq("id", user.id)
    .order("username");

  if (error) {
    console.log(error.message);
    return [];
  }

  return data;
};

export const getProfileById = async (
  userId: string,
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, created_at, bio")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.log(error.message);
    return null;
  }

  return data;
};

export const updateMyProfile = async ({
  username,
  fullName,
  avatarUrl,
  bio,
}: {
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}): Promise<Profile | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const cleanUsername = username.trim();
  const cleanFullName = fullName?.trim() || null;
  const cleanAvatarUrl = avatarUrl?.trim() || null;
  const cleanBio = bio?.trim() || null;

  if (cleanUsername.length < 2) return null;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      username: cleanUsername,
      full_name: cleanFullName,
      avatar_url: cleanAvatarUrl,
      bio: cleanBio,
    })
    .eq("id", user.id)
    .select("id, username, full_name, avatar_url, created_at, bio")
    .single();

  if (error) {
    console.log(error.message);
    return null;
  }

  return data;
};

export const getMyProfileSettings =
  async (): Promise<ProfileSettings | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profile_settings")
      .select(
        "id, user_id, is_profile_public, show_online_status, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.log(error.message);
      return null;
    }

    return data;
  };

export const updateMyProfileSettings = async ({
  isProfilePublic,
  showOnlineStatus,
}: {
  isProfilePublic: boolean;
  showOnlineStatus: boolean;
}): Promise<ProfileSettings | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profile_settings")
    .upsert(
      {
        user_id: user.id,
        is_profile_public: isProfilePublic,
        show_online_status: showOnlineStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select(
      "id, user_id, is_profile_public, show_online_status, created_at, updated_at",
    )
    .single();

  if (error) {
    console.log(error.message);
    return null;
  }

  return data;
};
