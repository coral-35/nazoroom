"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CountdownTimer } from "@/components/player/CountdownTimer";
import { ExplorePanel } from "@/components/player/ExplorePanel";
import { PuzzleCarousel } from "@/components/player/PuzzleCarousel";
import { RankingTable } from "@/components/player/RankingTable";
import { TreasureList } from "@/components/player/TreasureList";
import { sortExploredRoomCards } from "@/lib/domain/explorationCards";
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
    sortExploredRoomCards(initialState?.explorationLogs ?? [])
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
        setCards(sortExploredRoomCards(nextState.explorationLogs));
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
      const exploredCard = explored.card;
      if (exploredCard) {
        setCards((current) => sortExploredRoomCards([...current, exploredCard]));
      }
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
          sortExploredRoomCards(
            current.map((card) =>
              card.roomCode === unlockedTreasure.roomCode
                ? { ...card, unlocked: true }
                : card
            )
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

  if (!playerId && !loading) {
    return (
      <main className="page-shell page-shell--center">
        <section className="panel">
          <h1 className="section-title">参加情報がありません</h1>
          <p className="lead">
            先にニックネームを登録してから探索を開始してください。
          </p>
          <Link
            href={`/events/${eventId}/join`}
            className="button button--primary"
          >
            参加画面へ
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="play-shell">
      <header className="player-header">
        <div className="player-header-row">
          <div>
            <p className="kicker">プレイヤー画面</p>
            <h1 className="card-title">{eventTitle}</h1>
            <p className="muted">
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

      <section className="puzzle-stage">
        <PuzzleCarousel cards={cards} loading={loading} />
      </section>

      <section className="control-bar">
        <ExplorePanel
          roomCode={roomCode}
          answer={answer}
          onRoomCodeChange={setRoomCode}
          onAnswerChange={setAnswer}
          onExplore={handleExplore}
          onUnlock={handleUnlock}
          feedback={feedback}
          exploreBusy={exploreBusy}
          unlockBusy={unlockBusy}
          disabled={disabled}
        />
      </section>

      <section className="dashboard-grid">
        <TreasureList treasures={treasures} />
        {ranking ? (
          <RankingTable ranking={ranking} />
        ) : timeUp ? (
          <div className="panel panel--tight">
            <h2 className="card-title">結果発表待ち</h2>
            <p className="lead lead--small">
              探索時間は終了しました。管理者が結果発表を行うとランキングを確認できます。
            </p>
          </div>
        ) : (
          <div className="panel panel--tight muted">
            ランキングは結果発表後に表示されます。
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

  const referenceTime = state.event.serverNow
    ? new Date(state.event.serverNow).getTime()
    : Date.now();

  return state.event.endsAt
    ? new Date(state.event.endsAt).getTime() <= referenceTime
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
