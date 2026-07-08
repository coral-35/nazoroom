"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CountdownTimer } from "@/components/player/CountdownTimer";
import { ExplorePanel } from "@/components/player/ExplorePanel";
import { PuzzleCarousel } from "@/components/player/PuzzleCarousel";
import { RankingTable } from "@/components/player/RankingTable";
import { TreasureList } from "@/components/player/TreasureList";
import type {
  ExploredRoomCard,
  ExploreResponse,
  RankingResponse,
  StateResponse,
  TreasureItem,
  UnlockResponse
} from "@/lib/types/app";

type PlayerAppProps = {
  eventId: string;
  initialPlayerId?: string | null;
  initialState?: StateResponse | null;
};

export function PlayerApp({
  eventId,
  initialPlayerId = null,
  initialState = null
}: PlayerAppProps) {
  const [playerId, setPlayerId] = useState<string | null>(initialPlayerId);
  const [state, setState] = useState<StateResponse | null>(initialState);
  const [cards, setCards] = useState<ExploredRoomCard[]>(
    initialState?.explorationLogs ?? []
  );
  const [treasures, setTreasures] = useState<TreasureItem[]>(
    initialState?.treasures ?? []
  );
  const [ranking, setRanking] = useState<RankingResponse | null>(
    initialState?.ranking ?? null
  );
  const [roomCode, setRoomCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialState);
  const [exploreBusy, setExploreBusy] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [timeUp, setTimeUp] = useState(initialState ? isExpired(initialState) : false);

  const loadState = useCallback(
    async (id: string) => {
      setLoading(true);
      setFeedback(null);
      try {
        const response = await fetch(
          `/api/events/${eventId}/state?playerId=${encodeURIComponent(id)}`
        );
        const data = (await response.json()) as StateResponse | { message?: string };

        if (!response.ok) {
          throw new Error("message" in data ? data.message : "状態を取得できませんでした。");
        }

        const nextState = data as StateResponse;
        setState(nextState);
        setCards(nextState.explorationLogs);
        setTreasures(nextState.treasures);
        setRanking(nextState.ranking);
        setTimeUp(isExpired(nextState));
      } catch (caught) {
        setFeedback(
          caught instanceof Error
            ? caught.message
            : "通信に失敗しました。時間をおいて再試行してください。"
        );
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  useEffect(() => {
    const fromUrl =
      initialPlayerId ?? new URLSearchParams(window.location.search).get("playerId");
    const stored = localStorage.getItem(`nazoroom.player.${eventId}`);
    const id = fromUrl ?? stored;

    if (!id) {
      setLoading(false);
      return;
    }

    setPlayerId(id);
    if (initialState && id === initialPlayerId) {
      setLoading(false);
      return;
    }

    void loadState(id);
  }, [eventId, initialPlayerId, initialState, loadState]);

  const disabled = loading || timeUp || !state;
  const eventTitle = state?.event.title ?? "宝探しイベント";

  async function handleExplore() {
    if (!playerId || !roomCode.trim()) {
      setFeedback("部屋番号を入力してください。");
      return;
    }

    setExploreBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/events/${eventId}/explore`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ playerId, roomCode })
      });
      const data = (await response.json()) as ExploreResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "探索できませんでした。");
      }

      const explored = data as ExploreResponse;
      setCards((current) => [...current, explored.card]);
      setFeedback(explored.message);
    } catch (caught) {
      setFeedback(
        caught instanceof Error
          ? caught.message
          : "通信に失敗しました。時間をおいて再試行してください。"
      );
    } finally {
      setExploreBusy(false);
    }
  }

  async function handleUnlock() {
    if (!playerId) {
      setFeedback("参加情報が確認できません。再参加してください。");
      return;
    }
    if (!roomCode.trim()) {
      setFeedback("部屋番号を入力してください。");
      return;
    }
    if (!answer.trim()) {
      setFeedback("解答を入力してください。");
      return;
    }

    setUnlockBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/events/${eventId}/unlock`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ playerId, roomCode, answer })
      });
      const data = (await response.json()) as UnlockResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "解錠できませんでした。");
      }

      const unlocked = data as UnlockResponse;
      setFeedback(unlocked.message);

      if (unlocked.result === "expired") {
        setTimeUp(true);
      }

      const unlockedTreasure = unlocked.treasure;
      if (unlockedTreasure) {
        setTreasures((current) => upsertTreasure(current, unlockedTreasure));
        setCards((current) =>
          current.map((card) =>
            card.roomCode === unlockedTreasure.roomCode
              ? { ...card, unlocked: true }
              : card
          )
        );
      }

      if (unlocked.result === "correct") {
        setAnswer("");
      }
    } catch (caught) {
      setFeedback(
        caught instanceof Error
          ? caught.message
          : "通信に失敗しました。時間をおいて再試行してください。"
      );
    } finally {
      setUnlockBusy(false);
    }
  }

  const treasureCount = treasures.length;
  const latestCard = useMemo(() => cards.at(-1), [cards]);

  if (!playerId && !loading) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-8">
        <section className="rounded-lg border border-[#d8e3df] bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-bold">参加情報がありません</h1>
          <p className="mt-3 leading-7 text-neutral-700">
            先にニックネームを登録してから探索を開始してください。
          </p>
          <Link
            href={`/events/${eventId}/join`}
            className="focus-ring mt-6 block rounded-md bg-[#008a72] px-4 py-3 text-center font-semibold text-white"
          >
            参加画面へ
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-4 sm:px-5">
      <header className="mb-3 rounded-lg border border-[#d8e3df] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#008a72]">プレイヤー画面</p>
            <h1 className="mt-1 text-xl font-bold">{eventTitle}</h1>
            <p className="mt-1 text-sm text-neutral-600">
              {state?.player.nickname ?? "読み込み中"} / 宝 {treasureCount}個
            </p>
          </div>
          <CountdownTimer
            status={state?.event.status}
            endsAt={state?.event.endsAt ?? null}
            onExpire={() => {
              setTimeUp(true);
              if (playerId) {
                void loadState(playerId);
              }
            }}
          />
        </div>
      </header>

      {feedback ? (
        <p className="mb-3 rounded-md border border-[#d8e3df] bg-white px-3 py-2 text-sm font-semibold">
          {feedback}
        </p>
      ) : null}

      <section className="min-h-[360px] flex-1">
        <PuzzleCarousel cards={cards} latestCard={latestCard} loading={loading} />
      </section>

      <section className="sticky bottom-0 -mx-4 mt-4 border-t border-[#d8e3df] bg-[#f7faf9]/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <ExplorePanel
          roomCode={roomCode}
          answer={answer}
          onRoomCodeChange={setRoomCode}
          onAnswerChange={setAnswer}
          onExplore={handleExplore}
          onUnlock={handleUnlock}
          exploreBusy={exploreBusy}
          unlockBusy={unlockBusy}
          disabled={disabled}
        />
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <TreasureList treasures={treasures} />
        {timeUp || ranking ? (
          <RankingTable ranking={ranking} />
        ) : (
          <div className="rounded-lg border border-[#d8e3df] bg-white p-4 text-sm leading-7 text-neutral-700">
            ランキングは制限時間終了後に表示されます。
          </div>
        )}
      </section>
    </main>
  );
}

function isExpired(state: StateResponse) {
  if (state.event.status === "ended") {
    return true;
  }

  return state.event.endsAt
    ? new Date(state.event.endsAt).getTime() <= Date.now()
    : false;
}

function upsertTreasure(
  current: TreasureItem[],
  treasure: NonNullable<UnlockResponse["treasure"]>
): TreasureItem[] {
  if (current.some((item) => item.roomCode === treasure.roomCode)) {
    return current;
  }

  return [
    ...current,
    {
      roomCode: treasure.roomCode,
      name: treasure.name,
      description: treasure.description,
      unlockedAt: treasure.unlockedAt
    }
  ];
}
