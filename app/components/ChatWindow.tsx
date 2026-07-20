"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { IoMdMenu } from "react-icons/io";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { RiRobot2Line } from "react-icons/ri";
import EmojiPicker from "../components/EmojiPicker";
import { getElizaResponse } from "../lib/eliza";
import { getMessages, sendMessage, type Message } from "../lib/messages";
import { supabase } from "../lib/supabase";

type ChatWindowProps = {
  chatType: "user" | "bot";
  chatId?: string;
  chatName?: string;
  goBack: () => void;
};

type ChatMessage = {
  id: string;
  content: string;
  sender: "me" | "other" | "bot";
};

export default function ChatWindow({
  chatType,
  chatId,
  chatName,
  goBack,
}: ChatWindowProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(
    chatType === "bot"
      ? [
          {
            id: "welcome-message",
            content: "Ahoj, som chatový bot",
            sender: "bot",
          },
        ]
      : [],
  );
  const [loading, setLoading] = useState(chatType === "user");

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (chatType !== "user" || !chatId) return;

    const loadMessages = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      currentUserIdRef.current = user.id;

      const data = await getMessages(chatId);

      const formattedMessages: ChatMessage[] = data.map((item) => ({
        id: item.id,
        content: item.content,
        sender: item.user_id === user.id ? "me" : "other",
      }));

      setMessages(formattedMessages);
      setLoading(false);
    };

    loadMessages();
  }, [chatType, chatId]);

  useEffect(() => {
    if (chatType !== "user" || !chatId) return;

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          setMessages((previousMessages) => {
            const alreadyExists = previousMessages.some(
              (item) => item.id === newMessage.id,
            );

            if (alreadyExists) return previousMessages;

            return [
              ...previousMessages,
              {
                id: newMessage.id,
                content: newMessage.content,
                sender:
                  newMessage.user_id === currentUserIdRef.current
                    ? "me"
                    : "other",
              },
            ];
          });

          setLoading(false);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatType, chatId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    setMessage("");
    setShowEmojiPicker(false);

    if (chatType === "bot") {
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: trimmedMessage,
        sender: "me",
      };

      setMessages((previousMessages) => [...previousMessages, newMessage]);

      const botResponse: ChatMessage = {
        id: crypto.randomUUID(),
        content: getElizaResponse(trimmedMessage),
        sender: "bot",
      };

      setTimeout(() => {
        setMessages((previousMessages) => [
          ...previousMessages,
          botResponse,
        ]);
      }, 500);

      return;
    }

    if (!chatId) return;

    const savedMessage = await sendMessage(chatId, trimmedMessage);

    if (!savedMessage) {
      setMessage(trimmedMessage);
      return;
    }

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        id: savedMessage.id,
        content: savedMessage.content,
        sender: "me",
      },
    ]);
  };

  return (
    <div className="flex h-120 w-full flex-col">
      <div className="flex h-12 w-full items-center justify-start rounded-t-3xl bg-blue-600 pl-2">
        <button
          type="button"
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:border-2 hover:shadow-xl"
          aria-label="Späť"
        >
          <IoArrowBack size={20} color="white" />
        </button>

        {chatType === "user" && (
          <div className="ml-3 flex min-w-0 items-center gap-3">
            <Image
              src="/chat/placeholder.svg"
              alt=""
              width={40}
              height={40}
              className="rounded-full"
            />

            <span className="truncate font-semibold text-white">
              {chatName ?? "Používateľ"}
            </span>
          </div>
        )}

        {chatType === "bot" && (
          <div className="absolute left-1/2">
            <RiRobot2Line size={25} />
          </div>
        )}

        <IoMdMenu size={25} color="white" className="ml-auto mr-2" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {loading && (
          <p className="text-center text-sm text-slate-500">
            Načítavam správy...
          </p>
        )}

        {!loading && chatType === "user" && messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">
            Zatiaľ tu nie sú žiadne správy.
          </p>
        )}

        {messages.map((item) => (
          <div
            key={item.id}
            className={`flex max-w-3/4 items-end gap-2 ${
              item.sender === "me" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {item.sender === "bot" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <RiRobot2Line size={18} />
              </div>
            ) : item.sender === "other" ? (
              <Image
                src="/chat/placeholder.svg"
                alt=""
                width={32}
                height={32}
                className="shrink-0 rounded-full"
              />
            ) : null}

            <span
              className={`min-w-0 max-w-[25ch] break-words rounded-2xl px-3 py-2 ${
                item.sender === "me"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-900"
              }`}
            >
              {item.content}
            </span>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div
        ref={emojiPickerRef}
        className="relative mt-auto flex h-10 rounded-3xl border border-slate-300 bg-white text-slate-900"
      >
        <input
          type="text"
          placeholder="Napíš správu..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSendMessage();
            }
          }}
          className="ml-3 w-full border-none bg-transparent focus:outline-none"
        />

        <button
          type="button"
          className="mr-2 flex items-center justify-center"
          onClick={() => setShowEmojiPicker((previous) => !previous)}
          aria-label="Otvoriť emoji"
        >
          <MdOutlineEmojiEmotions size={25} />
        </button>

        {showEmojiPicker && (
          <EmojiPicker
            onSelectEmoji={(emoji) => {
              setMessage((previousMessage) => previousMessage + emoji);
              setShowEmojiPicker(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
