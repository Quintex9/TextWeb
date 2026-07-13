"use client";
import { useState } from "react";
import Image from "next/image";

export default function Page() {
  const [activeButton, setActiveButton] = useState("chat");


  return (
    <main className="flex min-h-screen flex-col bg-gray-200">

      <header className="flex flex-col justify-center h-15 bg-gray-300 shadow-xl">
        <h1 className="text-xl font-bold  text-gray-800 p-4">
          Text test web
        </h1>
      </header>

      <section className="flex flex-col justify-center items-center pt-2">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Vítaj v prototype textového webu
        </h2>
        <p className="text-gray-700 text-center max-w-md">
          Nižšie máš sekciu kde môžeš písať
        </p>
      </section>


      <section className="flex flex-row justify-center items-center pb-2">
        <button className={`w-20 h-10 rounded-2xl mt-3 mx-1 ${activeButton === "chat" ? "bg-blue-600 text-white" : "bg-blue-500"}`}
          onClick={() => setActiveButton("chat")}>
          Chat
        </button>
        <button className={`w-20 h-10 rounded-2xl mt-3 mx-1 ${activeButton === "groups" ? "bg-blue-600 text-white" : "bg-blue-500"}`}
          onClick={() => setActiveButton("groups")}>
          Skupiny
        </button>
      </section>

      <section className="flex min-h-120 w-1/3 flex-row self-center justify-items-start shadow-md rounded-3xl">
        {activeButton === "chat" && (
          <div className="flex flex-col w-full pt-3 gap-2">
            <div className={`flex ml-2 hover:bg-gray-300 hover:rounded-2xl mr-2`}>
              <Image src="/chat/placeholder.svg" alt="Chat placeholder" width={50} height={50} />
              <div>
                <h3 className="text-md font-bold text-gray-800 translate-y-0.5 pl-2">Náhodná osoba</h3>
                <p className="text-gray-700 text-sm pl-2">Čau</p>
              </div>
            </div>
            <div className={`flex ml-2 hover:bg-gray-300 hover:rounded-2xl mr-2`}>
              <Image src="/chat/placeholder.svg" alt="Chat placeholder" width={50} height={50} />
              <div>
                <h3 className="text-md font-bold text-gray-800 translate-y-0.5 pl-2">Náhodná osoba 2</h3>
                <p className="text-gray-700 text-sm pl-2">Čau</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm text-center pt-20">Ak chceš niekoho nájsť použi search!</p>
          </div>
        )}
      </section>
    </main>
  );
}