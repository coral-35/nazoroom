"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  cachePlayer,
  findCachedPlayer,
  playPathForCachedPlayer
} from "@/components/player/playerCache";
import type { JoinResponse } from "@/lib/types/app";

type JoinFormProps = {
  eventId: string;
  apiBasePath?: string;
  playPath?: string;
};

export function JoinForm({
  eventId,
  apiBasePath = `/api/events/${eventId}`,
  playPath = `/events/${eventId}/play`
}: JoinFormProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const cachedPlayer = findCachedPlayer(eventId);
    if (cachedPlayer) {
      router.replace(playPathForCachedPlayer(cachedPlayer, eventId, playPath));
      return;
    }

    setMounted(true);
  }, [eventId, playPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!nickname.trim()) {
      setError("ニックネームを入力してください。");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${apiBasePath}/join`, {
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
      cachePlayer(eventId, joined.player.id);
      router.push(`${playPath}?playerId=${joined.player.id}`);
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
    <form onSubmit={handleSubmit} className="panel form">
      <label className="field">
        ニックネーム
        <input
          name="nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={32}
          className="input"
          placeholder="テスト太郎"
          autoComplete="nickname"
        />
      </label>
      {error ? (
        <p className="message message--error">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || !mounted}
        className="button button--primary button--full"
      >
        {busy ? "参加中..." : "参加する"}
      </button>
    </form>
  );
}
