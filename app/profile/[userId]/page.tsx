"use client";

import Image from "next/image";
import Header from "../../components/Header";
import {
  IoMailOutline,
  IoPeopleOutline,
  IoPersonAddOutline,
  IoSettingsOutline,
} from "react-icons/io5";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gray-200">
      <Header />

      <section className="mx-auto mt-8 w-full max-w-2xl px-4">
        <div className="overflow-hidden rounded-3xl bg-stone-100 shadow-lg">
          {/* MODRÁ HORNÁ ČASŤ */}
          <div className="relative h-32 bg-blue-400">
            <button
              type="button"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-white hover:bg-white/50"
            >
              <IoSettingsOutline size={22} />
            </button>
          </div>

          {/* PROFILOVÁ FOTKA */}
          <div className="relative px-6">
            <div className="absolute -top-16 rounded-full border-4 border-stone-100 bg-stone-200">
              <Image
                src="/chat/placeholder.svg"
                alt="Profilová fotografia"
                width={120}
                height={120}
                className="rounded-full"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                className="rounded-2xl bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Upraviť profil
              </button>
            </div>
          </div>

          {/* INFORMÁCIE */}
          <div className="px-6 pb-6 pt-8">
            <h1 className="text-2xl font-bold text-stone-800">
              Používateľské meno
            </h1>

            <div className="mt-1 flex items-center gap-2 text-sm text-stone-500">
              <IoMailOutline size={18} />
              <span>email@example.com</span>
            </div>

            <p className="mt-4 max-w-lg text-stone-600">
              Tu bude krátky popis používateľa. Môže o sebe napísať
              niekoľko viet alebo uviesť svoje záujmy.
            </p>

            {/* ŠTATISTIKY */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm hover:bg-stone-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <IoPeopleOutline size={22} />
                </div>

                <div>
                  <p className="text-xl font-bold text-stone-800">0</p>
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
                  <p className="text-xl font-bold text-stone-800">0</p>
                  <p className="text-sm text-stone-500">Žiadosti</p>
                </div>
              </button>
            </div>

            {/* DETAILY */}
            <div className="mt-6">
              <h2 className="text-lg font-bold text-stone-800">
                Informácie
              </h2>

              <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex justify-between border-b border-stone-200 py-3">
                  <span className="text-stone-500">
                    Používateľské meno
                  </span>

                  <span className="font-semibold text-stone-800">
                    username
                  </span>
                </div>

                <div className="flex justify-between py-3">
                  <span className="text-stone-500">
                    Člen od
                  </span>

                  <span className="font-semibold text-stone-800">
                    júl 2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}