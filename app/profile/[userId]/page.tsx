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
import {
  getProfileById,
  getMyProfileSettings,
  updateMyProfileSettings,
  updateMyProfile,
  type Profile,
  type ProfileSettings,
} from "../../lib/users";
import { useOnlineUsers } from "../../lib/useOnlineUsers";

export default function ProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileSettings, setProfileSettings] =
    useState<ProfileSettings | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [contactsCount, setContactsCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editIsProfilePublic, setEditIsProfilePublic] = useState(true);
  const [editShowOnlineStatus, setEditShowOnlineStatus] = useState(true);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const { isUserOnline } = useOnlineUsers();
  const profileIsOnline = isUserOnline(userId);

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
      const ownProfile = user?.id === userId;
      const loadedSettings = ownProfile ? await getMyProfileSettings() : null;

      setProfile(loadedProfile);
      setEditUsername(loadedProfile?.username ?? "");
      setEditFullName(loadedProfile?.full_name ?? "");
      setEditAvatarUrl(loadedProfile?.avatar_url ?? "");
      setEditBio(loadedProfile?.bio ?? "");
      setProfileSettings(loadedSettings);
      setEditIsProfilePublic(loadedSettings?.is_profile_public ?? true);
      setEditShowOnlineStatus(loadedSettings?.show_online_status ?? true);
      setContactsCount(acceptedContactsCount);
      setRequestsCount(pendingRequestsCount);
      setIsOwnProfile(ownProfile);
      setEmail(ownProfile ? user.email ?? null : null);
      setLoading(false);
    };

    loadProfile();
  }, [userId]);

  const handleStartEditing = () => {
    setEditUsername(profile?.username ?? "");
    setEditFullName(profile?.full_name ?? "");
    setEditAvatarUrl(profile?.avatar_url ?? "");
    setEditBio(profile?.bio ?? "");
    setEditIsProfilePublic(profileSettings?.is_profile_public ?? true);
    setEditShowOnlineStatus(profileSettings?.show_online_status ?? true);
    setEditMessage(null);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setEditUsername(profile?.username ?? "");
    setEditFullName(profile?.full_name ?? "");
    setEditAvatarUrl(profile?.avatar_url ?? "");
    setEditBio(profile?.bio ?? "");
    setEditIsProfilePublic(profileSettings?.is_profile_public ?? true);
    setEditShowOnlineStatus(profileSettings?.show_online_status ?? true);
    setEditMessage(null);
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (editUsername.trim().length < 2) {
      setEditMessage("Meno musí mať aspoň 2 znaky.");
      return;
    }

    setSaving(true);
    setEditMessage(null);

    const updatedProfile = await updateMyProfile({
      username: editUsername,
      fullName: editFullName,
      avatarUrl: editAvatarUrl,
      bio: editBio,
    });

    const updatedSettings = await updateMyProfileSettings({
      isProfilePublic: editIsProfilePublic,
      showOnlineStatus: editShowOnlineStatus,
    });

    setSaving(false);

    if (!updatedProfile || !updatedSettings) {
      setEditMessage("Profil sa nepodarilo uložiť.");
      return;
    }

    setProfile(updatedProfile);
    setProfileSettings(updatedSettings);
    setIsEditing(false);
    setEditMessage("Profil bol uložený.");
  };

  const joinedDate = profile?.created_at
    ? new Intl.DateTimeFormat("sk-SK", {
        month: "long",
        year: "numeric",
      }).format(new Date(profile.created_at))
    : "Neznáme";

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
          <div className="relative h-36 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-400">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent" />
            {isOwnProfile && !isEditing && (
              <button
                type="button"
                onClick={handleStartEditing}
                className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                <IoSettingsOutline size={18} />
                Upraviť profil
              </button>
            )}
          </div>

          <div className="px-5 pb-6 sm:px-6">
            {loading && (
              <p className="py-12 text-center text-slate-500">
                Načítavam profil...
              </p>
            )}

            {!loading && !profile && (
              <p className="py-12 text-center text-slate-500">
                Profil sa nenašiel.
              </p>
            )}

            {!loading && profile && (
              <>
                <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex min-w-0 items-end gap-4">
                    <div className="relative rounded-full border-4 border-white bg-slate-100 shadow-sm">
                      <Image
                        src={profile.avatar_url ?? "/chat/placeholder.svg"}
                        alt=""
                        width={112}
                        height={112}
                        className="h-28 w-28 rounded-full object-cover"
                        priority
                      />
                      {profileIsOnline && (
                        <span className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-white bg-green-500" />
                      )}
                    </div>

                    <div className="min-w-0 pb-1">
                      <h1 className="truncate text-2xl font-bold text-slate-950">
                        {profile.full_name || profile.username}
                      </h1>
                      <p className="truncate text-sm font-semibold text-slate-500">
                        @{profile.username}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                      profileIsOnline
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {profileIsOnline ? "Online" : "Offline"}
                  </span>
                </div>

                {editMessage && (
                  <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {editMessage}
                  </p>
                )}

                <div className="mt-6 rounded-2xl bg-blue-50 p-4">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-blue-700">
                    Bio
                  </h2>
                  <p className="mt-2 text-slate-700">
                    {profile.bio ||
                      `Toto je profil používateľa ${profile.username}.`}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <IoPeopleOutline size={22} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-950">
                      {contactsCount}
                    </p>
                    <p className="text-sm text-slate-500">Kontakty</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <IoPersonAddOutline size={22} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-950">
                      {requestsCount}
                    </p>
                    <p className="text-sm text-slate-500">Žiadosti</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          {isEditing && profile && (
            <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">
                Upraviť profil
              </h2>

              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Používateľské meno
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={(event) => setEditUsername(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-600"
              />

              <label className="mt-3 block text-sm font-semibold text-slate-700">
                Celé meno
              </label>
              <input
                type="text"
                value={editFullName}
                onChange={(event) => setEditFullName(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-600"
              />

              <label className="mt-3 block text-sm font-semibold text-slate-700">
                Avatar URL
              </label>
              <input
                type="url"
                value={editAvatarUrl}
                onChange={(event) => setEditAvatarUrl(event.target.value)}
                placeholder="https://..."
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-600"
              />

              <label className="mt-3 block text-sm font-semibold text-slate-700">
                Bio
              </label>
              <textarea
                value={editBio}
                onChange={(event) => setEditBio(event.target.value)}
                rows={4}
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />

              <div className="mt-4 grid gap-2">
                <label className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Verejný profil
                  <input
                    type="checkbox"
                    checked={editIsProfilePublic}
                    onChange={(event) =>
                      setEditIsProfilePublic(event.target.checked)
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Zobraziť online status
                  <input
                    type="checkbox"
                    checked={editShowOnlineStatus}
                    onChange={(event) =>
                      setEditShowOnlineStatus(event.target.checked)
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveProfile}
                  className="h-10 flex-1 rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {saving ? "Ukladám..." : "Uložiť"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCancelEditing}
                  className="h-10 flex-1 rounded-xl bg-slate-100 px-4 font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Zrušiť
                </button>
              </div>
            </section>
          )}

          {!loading && profile && (
            <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Informácie</h2>

              <div className="mt-3 divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm text-slate-500">
                    Používateľské meno
                  </span>
                  <span className="truncate font-semibold text-slate-900">
                    {profile.username}
                  </span>
                </div>

                {profile.full_name && (
                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm text-slate-500">Celé meno</span>
                    <span className="truncate font-semibold text-slate-900">
                      {profile.full_name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <IoCalendarOutline size={18} />
                    Člen od
                  </span>
                  <span className="font-semibold text-slate-900">
                    {joinedDate}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <IoMailOutline size={18} />
                    Email
                  </span>
                  <span className="truncate font-semibold text-slate-900">
                    {email ?? "Súkromný"}
                  </span>
                </div>
              </div>
            </section>
          )}

          {isOwnProfile && profileSettings && (
            <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Nastavenia</h2>

              <div className="mt-3 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Verejný profil</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {profileSettings.is_profile_public ? "Zapnutý" : "Vypnutý"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Online status</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {profileSettings.show_online_status
                      ? "Zobrazený"
                      : "Skrytý"}
                  </p>
                </div>
              </div>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
