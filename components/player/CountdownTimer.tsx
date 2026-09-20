"use client";

import { useEffect, useRef, useState } from "react";
import type { EventStatus } from "@/lib/types/app";

type CountdownTimerProps = {
  status?: EventStatus;
  startAt: number | null;
  deadlineAt: number | null;
  onExpire: () => void;
};

export function CountdownTimer({ status, startAt, deadlineAt, onExpire }: CountdownTimerProps) {
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const expiredOnce = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredOnce.current = false;

    if (!startAt || !deadlineAt) {
      setElapsedMs(null);
      return;
    }

    const tick = () => {
      const now = Date.now();
      setElapsedMs(Math.max(0, Math.min(now, deadlineAt) - startAt));

      if ((status === "ended" || now >= deadlineAt) && !expiredOnce.current) {
        expiredOnce.current = true;
        onExpireRef.current();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1_000);

    return () => window.clearInterval(intervalId);
  }, [deadlineAt, startAt, status]);

  return (
    <div className="timer-box">
      <p className="timer-label">経過時間</p>
      <p className="timer-value">
        {elapsedMs === null ? "--:--" : formatElapsed(elapsedMs)}
      </p>
    </div>
  );
}

export function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
