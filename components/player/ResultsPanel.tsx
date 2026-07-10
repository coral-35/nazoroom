"use client";

import { useEffect, useState } from "react";
import { RankingTable } from "@/components/player/RankingTable";
import type { RankingResponse } from "@/lib/types/app";

type ResultsPanelProps = {
  eventId: string;
  apiBasePath?: string;
};

export function ResultsPanel({
  eventId,
  apiBasePath = `/api/events/${eventId}`
}: ResultsPanelProps) {
  const [ranking, setRanking] = useState<RankingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRanking() {
      try {
        const response = await fetch(`${apiBasePath}/ranking`);
        const data = (await response.json()) as RankingResponse | { message?: string };

        if (!response.ok) {
          throw new Error("message" in data ? data.message : "ランキングを取得できませんでした。");
        }

        setRanking(data as RankingResponse);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "通信に失敗しました。時間をおいて再試行してください。"
        );
      }
    }

    void loadRanking();
  }, [apiBasePath]);

  if (error) {
    return (
      <p className="message message--error">
        {error}
      </p>
    );
  }

  return <RankingTable ranking={ranking} />;
}
