import { supabase } from "./supabase";

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string | null;
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
    .select("id, username, avatar_url, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.log(error.message);
    return null;
  }

  return data;
};
