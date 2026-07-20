"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type OnlinePresence = {
  user_id?: string;
};

export const useOnlineUsers = () => {
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const startPresence = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const { data: settings } = await supabase
        .from("profile_settings")
        .select("show_online_status")
        .eq("user_id", user.id)
        .maybeSingle();

      const shouldTrackOnline = settings?.show_online_status ?? true;

      channel = supabase.channel("online-users", {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      const syncOnlineUsers = () => {
        if (!channel || cancelled) return;

        const presenceState = channel.presenceState();
        const onlineIds = new Set<string>();

        Object.values(presenceState).forEach((presences) => {
          presences.forEach((presence) => {
            const typedPresence = presence as OnlinePresence;

            if (typedPresence.user_id) {
              onlineIds.add(typedPresence.user_id);
            }
          });
        });

        setOnlineUserIds(Array.from(onlineIds));
      };

      channel
        .on("presence", { event: "sync" }, syncOnlineUsers)
        .on("presence", { event: "join" }, syncOnlineUsers)
        .on("presence", { event: "leave" }, syncOnlineUsers)
        .subscribe(async (status) => {
          if (status !== "SUBSCRIBED" || !channel) return;

          if (shouldTrackOnline) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }

          syncOnlineUsers();
        });
    };

    startPresence();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return {
    onlineUserIds,
    isUserOnline: (userId: string) => onlineUserIds.includes(userId),
  };
};
