"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import {
  IoCalendarOutline,
  IoMailOutline,
  IoPeopleOutline,
  IoPersonAddOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import {
  getAcceptedContactsCount,
  getPendingFollowRequestsCount,
} from "../../lib/follows";
import { supabase } from "../../lib/supabase";
import { getProfileById, type Profile } from "../../lib/users";

export default function ProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [contactsCount, setContactsCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      const [
        loadedProfile,
        acceptedContactsCount,
        pendingRequestsCount,
        {
          data: { user },
        },
      ] = await Promise.all([
        getProfileById(userId),
        getAcceptedContactsCount(userId),
        getPendingFollowRequestsCount(userId),
        supabase.auth.getUser(),
      ]);

      setProfile(loadedProfile);
      setContactsCount(acceptedContactsCount);
      setRequestsCount(pendingRequestsCount);
      setIsOwnProfile(user?.id === userId);
      setEmail(user?.id === userId ? user.email ?? null : null);
      setLoading(false);
    };

    loadProfile();
  }, [userId]);

  const joinedDate = profile?.created_at
    ? new Intl.DateTimeFormat("sk-SK", {
        month: "long",
        year: "numeric",
      }).format(new Date(profile.created_at))
    : "Nezname";

  return (
    <main className="min-h-screen bg-gray-200">
      <Header />

      <section className="mx-auto mt-8 w-full max-w-2xl px-4">
        <div className="overflow-hidden rounded-3xl bg-stone-100 shadow-lg">
          <div className="relative h-32 bg-blue-400">
            {isOwnProfile && (
              <button
                type="button"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-white hover:bg-white/50"
                aria-label="Nastavenia profilu"
              >
                <IoSettingsOutline size={22} />
              </button>
            )}
          </div>

          <div className="relative px-6">
            <div className="absolute -top-16 rounded-full border-4 border-stone-100 bg-stone-200">
              <Image
                src={profile?.avatar_url ?? "/chat/placeholder.svg"}
                alt=""
                width={120}
                height={120}
                className="rounded-full"
                priority
              />
            </div>

            <div className="flex justify-end pt-4">
              {isOwnProfile && (
                <button
                  type="button"
                  className="rounded-2xl bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Upravit profil
                </button>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 pt-8">
            {loading && (
              <p className="py-10 text-center text-stone-500">
                Nacitavam profil...
              </p>
            )}

            {!loading && !profile && (
              <p className="py-10 text-center text-stone-500">
                Profil sa nenasiel.
              </p>
            )}

            {!loading && profile && (
              <>
                <h1 className="text-2xl font-bold text-stone-800">
                  {profile.username}
                </h1>

                <div className="mt-1 flex items-center gap-2 text-sm text-stone-500">
                  <IoMailOutline size={18} />
                  <span>{email ?? "Email je sukromny"}</span>
                </div>

                <p className="mt-4 max-w-lg text-stone-600">
                  Toto je profil pouzivatela {profile.username}.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm hover:bg-stone-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <IoPeopleOutline size={22} />
                    </div>

                    <div>
                      <p className="text-xl font-bold text-stone-800">
                        {contactsCount}
                      </p>
                      <p className="text-sm text-stone-500">Kontakty</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm hover:bg-stone-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <IoPersonAddOutline size={22} />
                    </div>

                    <div>
                      <p className="text-xl font-bold text-stone-800">
                        {requestsCount}
                      </p>
                      <p className="text-sm text-stone-500">Ziadosti</p>
                    </div>
                  </button>
                </div>

                <div className="mt-6">
                  <h2 className="text-lg font-bold text-stone-800">
                    Informacie
                  </h2>

                  <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex justify-between border-b border-stone-200 py-3">
                      <span className="text-stone-500">
                        Pouzivatelske meno
                      </span>

                      <span className="font-semibold text-stone-800">
                        {profile.username}
                      </span>
                    </div>

                    <div className="flex justify-between py-3">
                      <span className="flex items-center gap-2 text-stone-500">
                        <IoCalendarOutline size={18} />
                        Clen od
                      </span>

                      <span className="font-semibold text-stone-800">
                        {joinedDate}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
