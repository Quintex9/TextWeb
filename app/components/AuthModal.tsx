"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { IoCloseSharp } from "react-icons/io5";

type AuthMode = "login" | "register" | "forgotPassword" | "newPassword";

type AuthModalProps = {
    isOpen: boolean;
    onClose: () => void;
    modeFromParent?: AuthMode;
};

export default function AuthModal({ isOpen, onClose, modeFromParent = "login" }: AuthModalProps) {

    const [mode, setMode] = useState<AuthMode>("login");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");


    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMode(modeFromParent);
        }
    }, [isOpen, modeFromParent])

    if (!isOpen) return null;

    const handleClose = () => {
        setError(null);
        setMessage("");
        setMode("login");
        setEmail("");
        setPassword("");
        setLoading(false);
        onClose();
    };

    const handleLogin = async () => {
        setLoading(true);
        setMessage("");
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Prihlásenie bolo úspešné.")
            handleClose()
        }
        setLoading(false);
    };

    const handleRegister = async () => {
        setLoading(true);
        setMessage("");
        setError(null);

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        };

        const userId = data.user?.id

        if (userId) {
            const result = await supabase.from("profiles").insert({
                id: userId,
                username,
            })

            const errorProfile = result.error

            if (errorProfile) {
                setError(errorProfile.message)
            } else {
                setMessage("Registrácia prebehla úspešne.")
                setMode("login");
            }

        }
        setLoading(false);
    }

    const handleForgotPassword = async () => {
        setLoading(true);
        setError(null);
        setMessage("");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Email na obnovu hesla bol úspešne odoslaný.")
        }

        setLoading(false);
    };

    const handleNewPassword = async () => {
        setLoading(true);
        setError(null);
        setMessage("")

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message)
            setLoading(false);
            return;
        } else {
            setMessage("Heslo bolo úspešne nastavené.")
            handleClose();
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40">
            <div className="w-100 rounded-3xl bg-stone-100 shadow-lg">

                {/* HEADER MODALU */}
                <div className="flex justify-between items-center p-4 shadow-md">
                    <h2 className="text-xl font-bold text-gray-800">
                        {mode === "login" && "Prihlásenie"}
                        {mode === "register" && "Registrácia"}
                        {mode === "forgotPassword" && "Zabudnuté heslo"}
                        {mode === "newPassword" && "Nové heslo"}
                    </h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                        <IoCloseSharp size={24} />
                    </button>
                </div>

                {error && (
                    <div className="mt-2 -mb-2 flex justify-center items-center font-semibold">
                        <p className="text-red-500">{error}</p>
                    </div>
                )}

                {message && (
                    <div className="mt-2 -mb-2 flex justify-center items-center font-semibold">
                        <p className="text-green-500">{message}</p>
                    </div>
                )}

                {/* BODY MODALU */}


                {/* LOGIN */}
                {mode === "login" && (
                    <div className="p-4">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleLogin();
                        }}>
                            <div className="mb-2">
                                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="shadow appearance-none border border-stone-300 rounded-3xl w-full py-2 px-3 text-gray-700 "
                                />
                            </div>

                            <div className="mb-2">
                                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
                                    Heslo
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="shadow appearance-none border border-stone-300 rounded-3xl w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div className="flex justify-center items-center">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mt-2 px-4 rounded-3xl w-full"
                                >
                                    {loading ? "Prihlasovanie..." : "Prihlásiť sa"}
                                </button>
                            </div>
                            <div className="flex flex-row  mt-2 gap-4 ">
                                <div className="flex justify-start mt-2 gap-1">
                                    Není si
                                    {mode === "login" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMode("register");
                                                setEmail("");
                                                setPassword("");
                                                setUsername("");
                                                setError(null);
                                            }}
                                            className="text-blue-500 hover:text-blue-700 font-semibold cursor-pointer"
                                        >
                                            registrovaný ?
                                        </button>
                                    )}
                                </div>

                                <div className="flex justify-end mt-2 gap-1 ml-auto">
                                    Zabudol si
                                    {mode === "login" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMode("forgotPassword");
                                                setEmail("");
                                                setPassword("");
                                                setUsername("");
                                                setError(null);
                                            }}
                                            className="text-blue-500 hover:text-blue-700 cursor-pointer font-semibold"
                                        >
                                            heslo?
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* REGISTER */}

                {mode === "register" && (
                    <div className="p-4">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleRegister();
                        }}>
                            <div className="mb-2">
                                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="shadow appearance-none border border-stone-300 rounded-3xl w-full py-2 px-3 text-gray-700 "
                                />
                            </div>

                            <div className="mb-2">
                                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
                                    Užívateľské meno
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="shadow appearance-none border border-stone-300 rounded-3xl w-full py-2 px-3 text-gray-700 "
                                />
                            </div>

                            <div className="mb-2">
                                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
                                    Heslo
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="shadow appearance-none border border-stone-300 rounded-3xl w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div className="flex justify-center items-center">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mt-2 px-4 rounded-3xl w-full cursor-pointer"
                                >
                                    {loading ? "Registrovanie..." : "Registrovať sa"}
                                </button>
                            </div>
                            <div className=" mt-2 gap-4 ">
                                <div className="flex justify-center mt-2 gap-1">
                                    Už máš
                                    {mode === "register" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMode("login");
                                                setEmail("");
                                                setPassword("");
                                                setUsername("");
                                                setError(null);
                                            }
                                            }
                                            className="text-blue-500 hover:text-blue-700 font-semibold cursor-pointer"
                                        >
                                            účet ?
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {mode === "forgotPassword" && (
                    <div className="p-4">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleForgotPassword();
                        }}>
                            <div className="mb-2">
                                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="shadow appearance-none border border-stone-300 rounded-3xl w-full py-2 px-3 text-gray-700 "
                                />
                            </div>

                            <div className="flex justify-center items-center">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mt-2 px-4 rounded-3xl w-full cursor-pointer"
                                >
                                    {loading ? "Potvrdzujem..." : "Potvrdiť"}
                                </button>
                            </div>

                            <div className="flex justify-center mt-2 gap-1">
                                Vráť sa na
                                {mode === "forgotPassword" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode("login");
                                            setEmail("");
                                            setPassword("");
                                            setUsername("");
                                            setError(null);
                                        }
                                        }
                                        className="text-blue-500 hover:text-blue-700 font-semibold cursor-pointer"
                                    >
                                        login
                                    </button>
                                )}
                            </div>


                        </form>
                    </div>
                )}

                {mode === "newPassword" && (
                    <div className="p-4">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleNewPassword();
                        }}>
                            <div className="mb-2">
                                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
                                    Zadaj nové heslo
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="shadow appearance-none border border-stone-300 rounded-3xl w-full py-2 px-3 text-gray-700 "
                                />
                            </div>

                            <div className="flex justify-center items-center">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mt-2 px-4 rounded-3xl w-full cursor-pointer"
                                >
                                    {loading ? "Potvrdzujem..." : "Potvrdiť"}
                                </button>
                            </div>

                        


                        </form>
                    </div>
                )}

            </div>
        </div>
    );
}