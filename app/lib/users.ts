import { supabase } from "./supabase";

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