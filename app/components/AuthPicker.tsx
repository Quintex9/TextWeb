
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type authPickerProp = {
    isOpen: boolean,
    onClose: () => void;
}

export default function AuthPicker({isOpen, onClose}: authPickerProp) {

    const options = ["Profile", "Log out"]

    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        onClose();
    }

    if (!isOpen) return null;


    return (
        <div className="absolute top-12 right-5 bg-gray-200 border border-gray-300 rounded-xl grid grid-cols-1 shadow w-18 overflow-hidden">
            {options.map((option, index) => (
                <div key={index}>
                    <button
                        onClick={() => (option === "Profile" ? router.push("/profile") : handleSignOut())}
                        className="flex w-full items-center justify-center  hover:bg-blue-400 hover:text-white"
                    >
                        {option}
                    </button>
                    {index !== options.length - 1 && (<div className="w-full bg-stone-900 h-px" />)}
                </div>
            ))
            }
        </div >
    )
}