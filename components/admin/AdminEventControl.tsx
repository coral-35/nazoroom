"use client";

import { useState } from "react";
import type {
  AdminEventControlResponse,
  EventControlAction,
  PublicEvent
} from "@/lib/types/app";

type AdminEventControlProps = {
  eventId: string;
  apiBasePath?: string;
  initialEvent: PublicEvent;
  initialMessage: string;
};

export function AdminEventControl({
  eventId,
  apiBasePath = `/api/admin/events/${eventId}`,
  initialEvent,
  initialMessage
}: AdminEventControlProps) {
  const [event, setEvent] = useState(initialEvent);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<EventControlAction | null>(null);

  async function control(action: EventControlAction) {
    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch(`${apiBasePath}/control`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          action,
          durationMinutes
        })
      });
      const data = (await response.json()) as
        | AdminEventControlResponse
        | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "管理操作に失敗しました。");
      }

      const result = data as AdminEventControlResponse;
      setEvent(result.event);
      setMessage(result.message);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "通信に失敗しました。時間をおいて再試行してください。"
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="panel form">
      <div className="admin-status-grid">
        <StatusItem label="状態" value={event.status} />
        <StatusItem label="開始" value={formatDateTime(event.startsAt)} />
        <StatusItem label="終了" value={formatDateTime(event.endsAt)} />
      </div>

      <label className="field">
        制限時間（分）
        <input
          type="number"
          min={1}
          max={1440}
          value={durationMinutes}
          onChange={(inputEvent) => setDurationMinutes(Number(inputEvent.target.value))}
          className="input"
        />
      </label>

      {message ? (
        <p className="message message--notice">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="message message--error">
          {error}
        </p>
      ) : null}

      <div className="button-grid">
        <ActionButton
          action="start_exploration"
          busyAction={busyAction}
          onClick={control}
        >
          探索を開始
        </ActionButton>
        <ActionButton
          action="close_exploration"
          busyAction={busyAction}
          onClick={control}
        >
          探索を終了
        </ActionButton>
        <ActionButton
          action="publish_results"
          busyAction={busyAction}
          onClick={control}
        >
          結果発表
        </ActionButton>
        <ActionButton
          action="reset"
          busyAction={busyAction}
          onClick={control}
          variant="secondary"
        >
          リセット
        </ActionButton>
      </div>
    </section>
  );
}

type ActionButtonProps = {
  action: EventControlAction;
  busyAction: EventControlAction | null;
  children: string;
  onClick: (action: EventControlAction) => void;
  variant?: "primary" | "secondary";
};

function ActionButton({
  action,
  busyAction,
  children,
  onClick,
  variant = "primary"
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`button ${variant === "primary" ? "button--primary" : "button--secondary"}`}
      disabled={busyAction !== null}
      onClick={() => onClick(action)}
    >
      {busyAction === action ? "処理中..." : children}
    </button>
  );
}

type StatusItemProps = {
  label: string;
  value: string;
};

function StatusItem({ label, value }: StatusItemProps) {
  return (
    <div className="status-item">
      <p className="kicker">{label}</p>
      <p className="strong">{value}</p>
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "未設定";
  }

  return value.replace("T", " ").slice(0, 16);
}
