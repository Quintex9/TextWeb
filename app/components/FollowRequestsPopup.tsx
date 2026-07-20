"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  acceptFollowRequest,
  getFollowRequests,
  rejectFollowRequest,
} from "../lib/follows";

type FollowRequest = {
  id: string;
  follower_id: string;
  follower?: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
};

type FollowRequestRow = Omit<FollowRequest, "follower"> & {
  follower?:
    | {
        id: string;
        username: string;
        avatar_url: string | null;
      }
    | {
        id: string;
        username: string;
        avatar_url: string | null;
      }[]
    | null;
};

type FollowRequestsPopupProps = {
  onClose: () => void;
  onRequestCountChange?: (count: number) => void;
};

export default function FollowRequestsPopup({
  onClose,
  onRequestCountChange,
}: FollowRequestsPopupProps) {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      const data = await getFollowRequests();
      const normalizedRequests = (data as unknown as FollowRequestRow[]).map(
        (request) => ({
          ...request,
          follower: Array.isArray(request.follower)
            ? request.follower[0] ?? null
            : request.follower ?? null,
        }),
      );

      setRequests(normalizedRequests);
      onRequestCountChange?.(normalizedRequests.length);
      setLoading(false);
    };

    loadRequests();
  }, [onRequestCountChange]);

  const handleAccept = async (requestId: string) => {
    const success = await acceptFollowRequest(requestId);

    if (success) {
      const nextRequests = requests.filter(
        (request) => request.id !== requestId,
      );

      setRequests(nextRequests);
      onRequestCountChange?.(nextRequests.length);
    }
  };

  const handleReject = async (requestId: string) => {
    const success = await rejectFollowRequest(requestId);

    if (success) {
      const nextRequests = requests.filter(
        (request) => request.id !== requestId,
      );

      setRequests(nextRequests);
      onRequestCountChange?.(nextRequests.length);
    }
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="font-semibold text-slate-900">Follow ziadosti</h2>
      </div>

      <div className="max-h-80 overflow-y-auto p-2">
        {loading && (
          <p className="p-3 text-center text-sm text-slate-500">
            Nacitavam...
          </p>
        )}

        {!loading && requests.length === 0 && (
          <p className="p-3 text-center text-sm text-slate-500">
            Nemate ziadne nove ziadosti.
          </p>
        )}

        {!loading &&
          requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"
            >
              <Image
                src={request.follower?.avatar_url ?? "/chat/placeholder.svg"}
                alt=""
                width={40}
                height={40}
                className="rounded-full"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {request.follower?.username ?? "Pouzivatel"}
                </p>
                <p className="text-xs text-slate-500">Chce ta followovat</p>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleAccept(request.id)}
                  className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Prijat
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(request.id)}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Nie
                </button>
              </div>
            </div>
          ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full border-t border-slate-100 py-2 text-sm text-slate-500 hover:bg-slate-50"
      >
        Zavriet
      </button>
    </div>
  );
}
