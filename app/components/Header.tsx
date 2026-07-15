import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import AuthModal from "./AuthModal";
import AuthPicker from "./AuthPicker";

export default function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAuthPicker, setShowAuthPicker] = useState(false);
  const router = useRouter();

  const [authModalMode, setAuthModalMode] = useState<
    "login" | "register" | "forgotPassword" | "newPassword"
  >("login");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setSignedIn(!!user);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(!!session?.user);

      if (event === "PASSWORD_RECOVERY"){
        setAuthModalMode("newPassword")
        setShowAuthModal(true);
      }
    });


    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleProfileClick = () => {
    if (signedIn) {
      setShowAuthPicker(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const authRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="flex flex-row justify-start h-15 bg-blue-500 shadow-xl">
      <h1
        onClick={() => router.push("./")}
        className="text-xl font-bold  text-gray-800 p-4 cursor-pointer">
        Text test web
      </h1>
      <div className="ml-auto flex">
        <button className="w-20 h-10 rounded-2xl mt-3 mx-1 bg-blue-500 text-white flex  items-center justify-center gap-2"
          onClick={() => handleProfileClick()}>
          <Image src="/chat/placeholder.svg" alt="Chat placeholder" width={40} height={40} className="cursor-pointer" />
        </button>
      </div>

      {showAuthPicker && (
        <div ref={authRef}>
          <AuthPicker isOpen={showAuthPicker} onClose={() => setShowAuthPicker(false)} />
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} modeFromParent={authModalMode} />

    </header>
  )
}