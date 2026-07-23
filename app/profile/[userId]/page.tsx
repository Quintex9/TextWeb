"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import {
  IoAtOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoDocumentTextOutline,
  IoImageOutline,
  IoMailOutline,
  IoPeopleOutline,
  IoPersonAddOutline,
  IoPersonCircleOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
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

  const profileTasks = useMemo(
    () => [
      {
        label: "Používateľské meno",
        done: Boolean(profile?.username),
        icon: IoAtOutline,
      },
      {
        label: "Celé meno",
        done: Boolean(profile?.full_name),
        icon: IoPersonCircleOutline,
      },
      {
        label: "Avatar",
        done: Boolean(profile?.avatar_url),
        icon: IoImageOutline,
      },
      {
        label: "Bio",
        done: Boolean(profile?.bio),
        icon: IoDocumentTextOutline,
      },
    ],
    [profile],
  );

  const completedProfileTasks = profileTasks.filter((task) => task.done).length;
  const profileCompletion = Math.round(
    (completedProfileTasks / profileTasks.length) * 100,
  );

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

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
          <div className="relative h-40 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-400">
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/15 to-transparent" />
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

          <div className="px-5 pb-6 sm:px-7">
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
                <div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex min-w-0 items-end gap-4">
                    <div className="relative rounded-full border-4 border-white bg-slate-100 shadow-sm">
                      <Image
                        src={profile.avatar_url ?? "/chat/placeholder.svg"}
                        alt=""
                        width={124}
                        height={124}
                        className="h-[124px] w-[124px] rounded-full object-cover"
                        priority
                      />
                      {profileIsOnline && (
                        <span className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-white bg-green-500" />
                      )}
                    </div>

                    <div className="min-w-0 pb-2">
                      <h1 className="truncate text-3xl font-bold text-slate-950">
                        {profile.full_name || profile.username}
                      </h1>
                      <p className="truncate text-sm font-semibold text-slate-500">
                        @{profile.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pb-2">
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                        profileIsOnline
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {profileIsOnline ? "Online" : "Offline"}
                    </span>
                    <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                      {isOwnProfile ? "Môj profil" : "Verejný profil"}
                    </span>
                  </div>
                </div>

                {editMessage && (
                  <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {editMessage}
                  </p>
                )}

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="rounded-2xl bg-blue-50 p-5">
                    <h2 className="text-sm font-bold uppercase text-blue-700">
                      Bio
                    </h2>
                    <p className="mt-2 leading-relaxed text-slate-700">
                      {profile.bio ||
                        `Toto je profil používateľa ${profile.username}.`}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">
                      Vyplnenie profilu
                    </p>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-3xl font-bold text-slate-950">
                        {profileCompletion}%
                      </span>
                      <span className="pb-1 text-sm text-slate-500">
                        {completedProfileTasks}/{profileTasks.length}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <ProfileMetric
                    icon={<IoPeopleOutline size={22} />}
                    label="Kontakty"
                    value={contactsCount}
                  />
                  <ProfileMetric
                    icon={<IoPersonAddOutline size={22} />}
                    label="Žiadosti"
                    value={requestsCount}
                  />
                  <ProfileMetric
                    icon={<IoShieldCheckmarkOutline size={22} />}
                    label="Viditeľnosť"
                    value={
                      profileSettings?.is_profile_public === false
                        ? "Súkromný"
                        : "Verejný"
                    }
                  />
                  <ProfileMetric
                    icon={<IoCalendarOutline size={22} />}
                    label="Člen od"
                    value={joinedDate}
                  />
                </div>

                <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-950">
                      Profilový prehľad
                    </h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {completedProfileTasks} hotové
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {profileTasks.map((task) => {
                      const Icon = task.icon;
                      const StatusIcon = task.done
                        ? IoCheckmarkCircleOutline
                        : IoCloseCircleOutline;

                      return (
                        <div
                          key={task.label}
                          className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <Icon size={20} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">
                              {task.label}
                            </p>
                            <p className="text-sm text-slate-500">
                              {task.done ? "Vyplnené" : "Chýba"}
                            </p>
                          </div>
                          <StatusIcon
                            size={22}
                            className={
                              task.done ? "text-green-600" : "text-slate-300"
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
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
                <ProfileInfoRow
                  icon={<IoAtOutline size={18} />}
                  label="Používateľské meno"
                  value={profile.username}
                />

                <ProfileInfoRow
                  icon={<IoPersonCircleOutline size={18} />}
                  label="Celé meno"
                  value={profile.full_name ?? "Nie je vyplnené"}
                />

                <ProfileInfoRow
                  icon={<IoCalendarOutline size={18} />}
                  label="Člen od"
                  value={joinedDate}
                />

                <ProfileInfoRow
                  icon={<IoMailOutline size={18} />}
                  label="Email"
                  value={email ?? "Súkromný"}
                />
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

          {!loading && profile && (
            <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">
                Rýchly súhrn
              </h2>

              <div className="mt-3 grid gap-3 text-sm text-slate-600">
                <p className="rounded-2xl bg-blue-50 p-3">
                  {profile.username} má {contactsCount} kontaktov a{" "}
                  {requestsCount} čakajúcich žiadostí.
                </p>
                <p className="rounded-2xl bg-slate-50 p-3">
                  Profil je aktuálne {profileIsOnline ? "online" : "offline"}.
                </p>
              </div>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}

function ProfileMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
        {icon}
      </div>
      <p className="mt-3 truncate text-xl font-bold text-slate-950">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function ProfileInfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </span>
      <span className="truncate font-semibold text-slate-900">{value}</span>
    </div>
  );
}
