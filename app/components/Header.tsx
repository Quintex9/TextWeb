import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IoIosNotificationsOutline } from "react-icons/io";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { supabase } from "../lib/supabase";
import AuthModal from "./AuthModal";
import AuthPicker from "./AuthPicker";

export default function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAuthPicker, setShowAuthPicker] = useState(false);
  const router = useRouter();
  const authRef = useRef<HTMLDivElement>(null);

  const [authModalMode, setAuthModalMode] = useState<
    "login" | "register" | "forgotPassword" | "newPassword"
  >("login");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setSignedIn(!!user);
      setUserId(user?.id ?? null);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(!!session?.user);
      setUserId(session?.user?.id ?? null);

      if (event === "PASSWORD_RECOVERY") {
        setAuthModalMode("newPassword");
        setShowAuthModal(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (authRef.current && !authRef.current.contains(event.target as Node)) {
        setShowAuthPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    if (signedIn) {
      setShowAuthPicker(true);
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="group flex items-center gap-3 rounded-full pr-3 text-left outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Prejst na uvod"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition group-hover:bg-blue-700">
            <IoChatbubbleEllipsesOutline size={22} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold text-slate-950 sm:text-lg">
              Text test web
            </span>
            <span className="hidden text-xs font-medium text-slate-500 sm:block">
              Chaty a skupiny
            </span>
          </span>
        </button>

        <div ref={authRef} className="relative ml-auto flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Notifikacie"
          >
            <IoIosNotificationsOutline size={24} />
          </button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm ring-1 ring-slate-200 transition hover:ring-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={handleProfileClick}
            aria-label={signedIn ? "Otvorit pouzivatelske menu" : "Prihlasit sa"}
          >
            <Image
              src="/chat/placeholder.svg"
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </button>

          {showAuthPicker && userId && (
            <AuthPicker
              userId={userId}
              isOpen={showAuthPicker}
              onClose={() => setShowAuthPicker(false)}
            />
          )}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        modeFromParent={authModalMode}
      />
    </header>
  );
}
