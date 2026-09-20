"use client";

import Link from "next/link";
import { normalizeRoomCode } from "@/lib/domain/normalize";
import { useCallback, useEffect, useState } from "react";
import { CountdownTimer } from "@/components/player/CountdownTimer";
import { ExplorePanel } from "@/components/player/ExplorePanel";
import { PuzzleCard } from "@/components/player/PuzzleCard";
import { RankingTable } from "@/components/player/RankingTable";
import { ClearedRoomList } from "@/components/player/ClearedRoomList";
import { sortExploredRoomCards } from "@/lib/domain/explorationCards";
import { calculateLocalDeadline, parseLocalStart } from "@/lib/domain/localTimer";
import type {
  ExploredRoomCard,
  ExploreResponse,
  RankingResponse,
  StateResponse,
  ClearedRoomItem,
  AnswerResponse
} from "@/lib/types/app";

type PlayerAppProps = {
  eventId: string;
  apiBasePath?: string;
  initialPlayerId?: string | null;
  initialState?: StateResponse | null;
  joinPath?: string;
};

export function PlayerApp({
  eventId,
  apiBasePath = `/api/events/${eventId}`,
  initialPlayerId = null,
  initialState = null,
  joinPath = `/events/${eventId}/join`
}: PlayerAppProps) {
  const [playerId, setPlayerId] = useState<string | null>(initialPlayerId);
  const [state, setState] = useState<StateResponse | null>(initialState);
  const [cards, setCards] = useState<ExploredRoomCard[]>(
    sortExploredRoomCards(initialState?.explorationLogs ?? [])
  );
  const [clearedRooms, setClearedRooms] = useState<ClearedRoomItem[]>(
    initialState?.clearedRooms ?? []
  );
  const [ranking, setRanking] = useState<RankingResponse | null>(
    initialState?.ranking ?? null
  );
  const [roomCode, setRoomCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialState);
  const [exploreBusy, setExploreBusy] = useState(false);
  const [answerBusy, setAnswerBusy] = useState(false);
  const [localStartAt, setLocalStartAt] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);

  const loadState = useCallback(
    async (id: string, silent = false) => {
      if (!silent) {
        setLoading(true);
        setFeedback(null);
      }
      try {
        const response = await fetch(
          `${apiBasePath}/state?playerId=${encodeURIComponent(id)}`
        );
        const data = (await response.json()) as StateResponse | { message?: string };

        if (!response.ok) {
          throw new Error("message" in data ? data.message : "状態を取得できませんでした。");
        }

        const nextState = data as StateResponse;
        setState(nextState);
        setCards(sortExploredRoomCards(nextState.explorationLogs));
        setClearedRooms(nextState.clearedRooms);
        setRanking(nextState.ranking);
        if (nextState.event.status === "ended" || nextState.event.endsAt) {
          setTimeUp(true);
        }
      } catch (caught) {
        setFeedback(
          caught instanceof Error
            ? caught.message
            : "通信に失敗しました。時間をおいて再試行してください。"
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [apiBasePath]
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

  useEffect(() => {
    if (!playerId || !state) {
      return;
    }

    if (state.event.status !== "active" || !state.event.startsAt) {
      if (state.event.status === "ended" || state.event.endsAt) {
        setTimeUp(true);
      }
      return;
    }

    const storageKey = `nazoroom.start.${eventId}.${playerId}`;
    const stored = parseLocalStart(localStorage.getItem(storageKey));
    const receivedAt =
      stored?.signal === state.event.startsAt ? stored.receivedAt : Date.now();

    if (!stored || stored.signal !== state.event.startsAt) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ signal: state.event.startsAt, receivedAt })
      );
    }

    setLocalStartAt(receivedAt);
    setTimeUp(
      Date.now() >= calculateLocalDeadline(receivedAt, state.event.durationMinutes)
    );
  }, [eventId, playerId, state]);

  useEffect(() => {
    if (!playerId || state?.event.status === "ended") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadState(playerId, true);
    }, 2_000);

    return () => window.clearInterval(intervalId);
  }, [loadState, playerId, state?.event.status]);

  const waiting = state?.event.status === "draft";
  const exploreDisabled = loading || !state || waiting;
  const answerDisabled = exploreDisabled || timeUp || !localStartAt;
  const eventTitle = state?.event.title ?? "謎解きダンジョン";
  const deadlineAt =
    localStartAt && state
      ? calculateLocalDeadline(localStartAt, state.event.durationMinutes)
      : null;

  async function handleExplore() {
    if (!playerId || !roomCode.trim()) {
      setFeedback("部屋番号を入力してください。");
      return;
    }

    setExploreBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`${apiBasePath}/explore`, {
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
        setCards((current) =>
          current.some((card) => card.logId === exploredCard.logId)
            ? current
            : sortExploredRoomCards([...current, exploredCard])
        );
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

  async function handleAnswer() {
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

    setAnswerBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`${apiBasePath}/answer`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ playerId, roomCode, answer })
      });
      const data = (await response.json()) as AnswerResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "解答を送信できませんでした。");
      }

      const result = data as AnswerResponse;
      setFeedback(result.message);

      if (result.result === "expired") {
        setTimeUp(true);
      }

      const clearedRoom = result.clearedRoom;
      if (clearedRoom) {
        setClearedRooms((current) => upsertClearedRoom(current, clearedRoom));
        setCards((current) =>
          sortExploredRoomCards(
            current.map((card) =>
              card.roomCode === clearedRoom.roomCode
                ? { ...card, cleared: true }
                : card
            )
          )
        );
      }

      if (result.result === "correct") {
        setAnswer("");
      }
    } catch (caught) {
      setFeedback(
        caught instanceof Error
          ? caught.message
          : "通信に失敗しました。時間をおいて再試行してください。"
      );
    } finally {
      setAnswerBusy(false);
    }
  }

  const clearedRoomCount = clearedRooms.length;
  const myRankIndex = ranking?.ranking.findIndex((row) => row.playerId === playerId) ?? -1;
  const myResult = myRankIndex >= 0 ? ranking?.ranking[myRankIndex] : null;

  if (!playerId && !loading) {
    return (
      <main className="page-shell page-shell--center">
        <section className="panel">
          <h1 className="section-title">参加情報がありません</h1>
          <p className="lead">
            先にニックネームを登録してから探索を開始してください。
          </p>
          <Link
            href={joinPath}
            className="button button--primary"
          >
            参加画面へ
          </Link>
        </section>
      </main>
    );
  }

  if (playerId && state?.event.status === "draft") {
    return (
      <main className="page-shell page-shell--center">
        <section className="panel waiting-panel">
          <p className="kicker">参加済み</p>
          <h1 className="section-title">開始を待っています</h1>
          <p className="lead">
            {state.player.nickname} さんの参加を受け付けました。管理者の開始合図を受信すると、この端末で{state.event.durationMinutes}分の計測を始めます。
          </p>
          <div className="waiting-pulse" aria-label="開始合図を確認中" />
          {feedback ? <p className="message message--error">{feedback}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="play-shell">
      <header className="player-header">
        <div className={`player-header-row${ranking ? " player-header-row--results" : ""}`}>
          <div>
            <h1 className="card-title">{eventTitle}</h1>
            <p className="muted">
              {state?.player.nickname ?? "読み込み中"} / 宝 {clearedRoomCount}個
            </p>
          </div>
          <div className="player-metrics">
            {ranking ? (
              <div className="personal-result" aria-label="自分の結果">
                <p className="timer-label">結果</p>
                <p className="personal-result-value">
                  {myResult ? `${myResult.score}点 / ${myRankIndex + 1}位` : "集計中"}
                </p>
              </div>
            ) : null}
            <CountdownTimer
              status={state?.event.status}
              deadlineAt={deadlineAt}
              onExpire={() => {
                setTimeUp(true);
              }}
            />
          </div>
        </div>
      </header>

      <section className="control-bar">
        <ExplorePanel
          roomCode={roomCode}
          answer={answer}
          onRoomCodeChange={setRoomCode}
          onAnswerChange={setAnswer}
          onExplore={handleExplore}
          onAnswer={handleAnswer}
          feedback={feedback}
          exploreBusy={exploreBusy}
          answerBusy={answerBusy}
          exploreDisabled={exploreDisabled}
          answerDisabled={answerDisabled}
        />
      </section>

      {cards.filter((card) => card.resultType === "show_puzzle" && normalizeRoomCode(card.roomCode) === normalizeRoomCode(roomCode) && !card.cleared).map((card) => (
        <PuzzleCard key={card.logId} card={card} />
      ))}

      <ClearedRoomList clearedRooms={clearedRooms} />

      {!ranking && timeUp ? (
        <section className="result-waiting">
          <div className="panel panel--tight">
            <h2 className="card-title">結果発表待ち</h2>
            <p className="lead lead--small">
              探索時間は終了しました。管理者が結果発表を行うとランキングを確認できます。
            </p>
          </div>
        </section>
      ) : null}

      {ranking ? (
        <section className="result-ranking">
          <RankingTable ranking={ranking} />
        </section>
      ) : null}
    </main>
  );
}

function upsertClearedRoom(
  current: ClearedRoomItem[],
  clearedRoom: NonNullable<AnswerResponse["clearedRoom"]>
): ClearedRoomItem[] {
  if (current.some((item) => item.roomCode === clearedRoom.roomCode)) {
    return current;
  }

  return [
    ...current,
    {
      treasureName: clearedRoom.treasureName,
      roomCode: clearedRoom.roomCode,
      clearedAt: clearedRoom.clearedAt
    }
  ];
}
