"use client";

import { useEffect, useState } from "react";
import type { AdminDashboardResponse } from "@/lib/types/app";

type AdminDashboardProps = {
  apiBasePath: string;
  initialDashboard: AdminDashboardResponse;
};

export function AdminDashboard({
  apiBasePath,
  initialDashboard
}: AdminDashboardProps) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch(`${apiBasePath}/dashboard`, {
          cache: "no-store"
        });
        const data = (await response.json()) as
          | AdminDashboardResponse
          | { message?: string };
        if (!response.ok) {
          throw new Error("message" in data ? data.message : "集計を取得できませんでした。");
        }
        setDashboard(data as AdminDashboardResponse);
        setError(null);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "集計の更新に失敗しました。");
      }
    };

    const intervalId = window.setInterval(() => void refresh(), 3_000);
    return () => window.clearInterval(intervalId);
  }, [apiBasePath]);

  return (
    <section className="panel admin-dashboard">
      <div className="admin-dashboard-summary">
        <DashboardMetric label="参加" value={`${dashboard.totalPlayers}人`} />
        <DashboardMetric label="クリア" value={`${dashboard.totalClears}件`} />
      </div>
      {dashboard.players.length ? (
        <div className="admin-player-list">
          {dashboard.players.map((player, index) => (
            <div className="admin-player-row" key={player.playerId}>
              <span>{index + 1}. {player.nickname}</span>
              <span>{player.clearedRoomCount}部屋 / {player.score}点</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted admin-empty">参加者を待っています。</p>
      )}
      {error ? <p className="message message--error">{error}</p> : null}
    </section>
  );
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-item">
      <p className="kicker">{label}</p>
      <p className="admin-metric-value">{value}</p>
    </div>
  );
}
