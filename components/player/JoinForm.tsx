"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { JoinResponse } from "@/lib/types/app";

type JoinFormProps = {
  eventId: string;
};

export function JoinForm({ eventId }: JoinFormProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!nickname.trim()) {
      setError("ニックネームを入力してください。");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ nickname })
      });
      const data = (await response.json()) as JoinResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "参加できませんでした。");
      }

      const joined = data as JoinResponse;
      localStorage.setItem(`nazoroom.player.${eventId}`, joined.player.id);
      router.push(`/events/${eventId}/play?playerId=${joined.player.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "通信に失敗しました。時間をおいて再試行してください。"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[#d8e3df] bg-white p-5 shadow-soft"
    >
      <label className="grid gap-2 text-sm font-semibold">
        ニックネーム
        <input
          name="nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={32}
          className="focus-ring rounded-md border border-[#c6d5d0] px-4 py-3 text-base"
          placeholder="テスト太郎"
          autoComplete="nickname"
        />
      </label>
      {error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-[#b42318]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || !mounted}
        className="focus-ring mt-5 w-full rounded-md bg-[#008a72] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {busy ? "参加中..." : "参加する"}
      </button>
    </form>
  );
}
