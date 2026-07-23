"use client";

import { useState } from "react";

export type GifOption = {
  title: string;
  url: string;
};

type EmojiCategory = {
  id: string;
  label: string;
  emojis: string[];
};

type EmojiPickerProps = {
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gif: GifOption) => void;
};

const emojiCategories: EmojiCategory[] = [
  {
    id: "smileys",
    label: "Smajlíky",
    emojis: [
      "😀",
      "😄",
      "😂",
      "🤣",
      "😊",
      "😍",
      "😘",
      "😎",
      "🥳",
      "🤔",
      "😅",
      "😭",
      "😡",
      "😴",
      "🤯",
      "😇",
    ],
  },
  {
    id: "hands",
    label: "Gestá",
    emojis: [
      "👍",
      "👎",
      "👏",
      "🙌",
      "🙏",
      "🤝",
      "💪",
      "👀",
      "✌️",
      "👌",
      "🤌",
      "🤙",
      "👋",
      "🫶",
      "🤟",
      "☝️",
    ],
  },
  {
    id: "hearts",
    label: "Reakcie",
    emojis: [
      "❤️",
      "💙",
      "💚",
      "💛",
      "🔥",
      "✨",
      "🎉",
      "💯",
      "⭐",
      "⚡",
      "✅",
      "❌",
      "🚀",
      "😬",
      "🙃",
      "👑",
    ],
  },
];

const gifOptions: GifOption[] = [
  {
    title: "Happy",
    url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  },
  {
    title: "Nice",
    url: "https://media.giphy.com/media/ely3apij36BJhoZ234/giphy.gif",
  },
  {
    title: "Wow",
    url: "https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif",
  },
  {
    title: "Typing",
    url: "https://media.giphy.com/media/13GIgrGdslD9oQ/giphy.gif",
  },
  {
    title: "Celebrate",
    url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  },
  {
    title: "OK",
    url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  },
];

export default function EmojiPicker({
  onSelectEmoji,
  onSelectGif,
}: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<"emoji" | "gif">("emoji");
  const [activeCategoryId, setActiveCategoryId] = useState(
    emojiCategories[0].id,
  );

  const activeCategory =
    emojiCategories.find((category) => category.id === activeCategoryId) ??
    emojiCategories[0];

  return (
    <div className="absolute bottom-12 right-0 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="grid grid-cols-2 border-b border-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("emoji")}
          className={`h-9 rounded-xl text-sm font-semibold ${
            activeTab === "emoji"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Emoji
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gif")}
          className={`h-9 rounded-xl text-sm font-semibold ${
            activeTab === "gif"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          GIF
        </button>
      </div>

      {activeTab === "emoji" && (
        <div className="p-3">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {emojiCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${
                  activeCategoryId === category.id
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-8 gap-1">
            {activeCategory.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSelectEmoji(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl hover:bg-blue-50"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "gif" && (
        <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto p-3">
          {gifOptions.map((gif) => (
            <button
              key={gif.url}
              type="button"
              onClick={() => onSelectGif(gif)}
              className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-left hover:border-blue-200 hover:bg-blue-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gif.url}
                alt={gif.title}
                className="h-20 w-full object-cover"
              />
              <span className="block truncate px-2 py-1 text-xs font-semibold text-slate-700">
                {gif.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
