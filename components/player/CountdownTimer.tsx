"use client";

import { useEffect, useRef, useState } from "react";
import type { EventStatus } from "@/lib/types/app";

type CountdownTimerProps = {
  status?: EventStatus;
  deadlineAt: number | null;
  onExpire: () => void;
};

export function CountdownTimer({ status, deadlineAt, onExpire }: CountdownTimerProps) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const expiredOnce = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredOnce.current = false;

    if (!deadlineAt || status === "ended") {
      setRemainingMs(null);
      return;
    }

    const tick = () => {
      const nextRemaining = calculateRemaining(deadlineAt);
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0 && !expiredOnce.current) {
        expiredOnce.current = true;
        onExpireRef.current();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1_000);

    return () => window.clearInterval(intervalId);
  }, [deadlineAt, status]);

  if (!deadlineAt && status !== "ended") {
    return (
      <div className="timer-box">
        <p className="timer-label">残り時間</p>
        <p className="timer-value">制限なし</p>
      </div>
    );
  }

  const expired = status === "ended" || (remainingMs !== null && remainingMs <= 0);

  return (
    <div className="timer-box">
      <p className="timer-label">残り時間</p>
      <p className="timer-value">
        {expired ? "終了" : remainingMs === null ? "--:--" : formatRemaining(remainingMs)}
      </p>
    </div>
  );
}

function calculateRemaining(deadlineAt: number | null) {
  if (!deadlineAt) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, deadlineAt - Date.now());
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.ceil(ms / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
