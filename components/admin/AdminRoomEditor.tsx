"use client";

import { FormEvent, useState } from "react";
import type {
  AdminRoomRecord,
  AdminRoomsResponse,
  ExploreType,
  ProblemBankRecord
} from "@/lib/types/app";

type AdminRoomEditorProps = {
  eventId: string;
  apiBasePath?: string;
  initialRooms: AdminRoomRecord[];
  initialProblems?: ProblemBankRecord[];
};

type EditableRoom = {
  id?: string;
  problemId: string;
  roomCode: string;
  exploreType: ExploreType;
  title: string;
  puzzleText: string;
  puzzleImageUrl: string;
  hiddenMessage: string;
  sortOrder: string;
  isActive: boolean;
  answersText: string;
};

const NEW_ROOM_KEY = "new-room";

export function AdminRoomEditor({
  eventId,
  apiBasePath = `/api/admin/events/${eventId}`,
  initialRooms,
  initialProblems = []
}: AdminRoomEditorProps) {
  const [rooms, setRooms] = useState(initialRooms.map(toEditableRoom));
  const [problems] = useState(initialProblems);
  const [newRoom, setNewRoom] = useState<EditableRoom>(createEmptyRoom());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function saveRoom(room: EditableRoom, key: string) {
    setBusyKey(key);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${apiBasePath}/rooms`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(toPayload(room))
      });
      const data = (await response.json()) as AdminRoomsResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "問題を保存できませんでした。");
      }

      const result = data as AdminRoomsResponse;
      setRooms(result.rooms.map(toEditableRoom));
      setMessage(result.message ?? "問題を保存しました。");
      if (key === NEW_ROOM_KEY) {
        setNewRoom(createEmptyRoom());
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "通信に失敗しました。時間をおいて再試行してください。"
      );
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="panel section-gap">
      <div className="panel-header">
        <div>
          <p className="kicker">問題DB</p>
          <h2 className="card-title">問題・解答を編集</h2>
        </div>
      </div>
      <p className="lead lead--small">
        部屋番号、表示内容、正解を保存します。解答は改行区切りで複数登録できます。
      </p>

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

      <div className="admin-room-list">
        {rooms.map((room, index) => (
          <RoomForm
            key={room.id}
            title={`部屋 ${room.roomCode || "未設定"}`}
            room={room}
            busy={busyKey === room.id}
            problems={problems}
            onChange={(patch) =>
              setRooms((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, ...patch } : item
                )
              )
            }
            onSave={(nextRoom) => saveRoom(nextRoom, room.id ?? String(index))}
          />
        ))}

        <RoomForm
          title="新しい問題を追加"
          room={newRoom}
          busy={busyKey === NEW_ROOM_KEY}
          problems={problems}
          onChange={(patch) => setNewRoom((current) => ({ ...current, ...patch }))}
          onSave={(nextRoom) => saveRoom(nextRoom, NEW_ROOM_KEY)}
        />
      </div>
    </section>
  );
}

type RoomFormProps = {
  title: string;
  room: EditableRoom;
  busy: boolean;
  problems: ProblemBankRecord[];
  onChange: (patch: Partial<EditableRoom>) => void;
  onSave: (room: EditableRoom) => void;
};

function RoomForm({ title, room, busy, problems, onChange, onSave }: RoomFormProps) {
  const selectedProblem = problems.find((problem) => problem.id === room.problemId);
  const isReserve = selectedProblem?.isReserve === true;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(isReserve ? { ...room, isActive: false } : room);
  }

  return (
    <form className="admin-room-card" onSubmit={handleSubmit}>
      <div className="card-header">
        <div>
          <p className="kicker">{isReserve ? "予備" : room.isActive ? "公開中" : "無効"}</p>
          <h3 className="card-title">
            {title} / {isReserve ? "宝未割当" : treasureLabel(room.sortOrder)}
          </h3>
        </div>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={!isReserve && room.isActive}
            disabled={isReserve}
            onChange={(event) => onChange({ isActive: event.target.checked })}
          />
          有効
        </label>
      </div>

      <div className="admin-room-fields">
        <label className="field">
          問題
          <select
            value={room.problemId}
            onChange={(event) => {
              const problem = problems.find((item) => item.id === event.target.value);
              onChange(
                problem
                  ? {
                      problemId: problem.id,
                      roomCode: problem.roomCode,
                      exploreType: "show_puzzle",
                      title: problem.title ?? `問題 ${problem.problemNumber}`,
                      puzzleText: "",
                      puzzleImageUrl: problem.puzzleImageUrl,
                      hiddenMessage: "",
                      isActive: !problem.isReserve,
                      answersText: problem.defaultAnswers.join("\n")
                    }
                  : { problemId: "" }
              );
            }}
            className="input"
          >
            <option value="">手入力</option>
            {problems.map((problem) => (
              <option key={problem.id} value={problem.id}>
                {problem.problemNumber}. 部屋 {problem.roomCode}
                {problem.isReserve ? "（予備）" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          部屋番号
          <input
            value={room.roomCode}
            onChange={(event) => onChange({ roomCode: event.target.value })}
            className="input"
            placeholder="305"
            disabled={Boolean(room.problemId)}
          />
        </label>
        <label className="field">
          表示タイプ
          <select
            value={room.exploreType}
            onChange={(event) =>
              onChange({ exploreType: event.target.value as ExploreType })
            }
            className="input"
            disabled={Boolean(room.problemId)}
          >
            <option value="show_puzzle">画面に謎を表示</option>
            <option value="hidden_clue">現地探索のみ</option>
          </select>
        </label>
        <label className="field">
          表示順
          <input
            type="number"
            min={0}
            max={9999}
            value={room.sortOrder}
            onChange={(event) => onChange({ sortOrder: event.target.value })}
            className="input"
          />
        </label>
        <label className="field field--full">
          タイトル
          <input
            value={room.title}
            onChange={(event) => onChange({ title: event.target.value })}
            className="input"
            placeholder="古びた時計の暗号"
            disabled={Boolean(room.problemId)}
          />
        </label>
        <label className="field field--full">
          謎文
          <textarea
            value={room.puzzleText}
            onChange={(event) => onChange({ puzzleText: event.target.value })}
            className="input input--textarea"
            disabled={Boolean(room.problemId)}
          />
        </label>
        <label className="field field--full">
          画像URL
          <input
            value={room.puzzleImageUrl}
            onChange={(event) => onChange({ puzzleImageUrl: event.target.value })}
            className="input"
            placeholder="https://..."
            disabled={Boolean(room.problemId)}
          />
        </label>
        <label className="field field--full">
          隠しメッセージ
          <textarea
            value={room.hiddenMessage}
            onChange={(event) => onChange({ hiddenMessage: event.target.value })}
            className="input input--textarea"
            disabled={Boolean(room.problemId)}
          />
        </label>
        <label className="field field--full">
          解答（改行区切り）
          <textarea
            value={room.answersText}
            onChange={(event) => onChange({ answersText: event.target.value })}
            className="input input--textarea"
            placeholder={"ひかり\nヒカリ"}
          />
        </label>
        {room.puzzleImageUrl ? (
          <div className="admin-problem-preview field--full">
            <img src={room.puzzleImageUrl} alt="" />
          </div>
        ) : null}
      </div>

      <div className="button-grid">
        <button type="submit" className="button button--primary" disabled={busy}>
          {busy ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          className="button button--secondary"
          disabled={busy || !room.id || !room.isActive}
          onClick={() => {
            const nextRoom = { ...room, isActive: false };
            onChange({ isActive: false });
            onSave(nextRoom);
          }}
        >
          無効化して保存
        </button>
      </div>
    </form>
  );
}

function treasureLabel(sortOrder: string) {
  const order = Number(sortOrder);
  if (!Number.isInteger(order) || order < 1 || order > 26) {
    return "宝未割当";
  }

  return `宝${String.fromCharCode(64 + order)}`;
}

function toEditableRoom(room: AdminRoomRecord): EditableRoom {
  return {
    id: room.id,
    problemId: room.problemId ?? "",
    roomCode: room.roomCode,
    exploreType: room.exploreType,
    title: room.title ?? "",
    puzzleText: room.puzzleText ?? "",
    puzzleImageUrl: room.puzzleImageUrl ?? "",
    hiddenMessage: room.hiddenMessage ?? "",
    sortOrder: String(room.sortOrder),
    isActive: room.isActive,
    answersText: room.answers.map((answer) => answer.answerText).join("\n")
  };
}

function createEmptyRoom(): EditableRoom {
  return {
    problemId: "",
    roomCode: "",
    exploreType: "show_puzzle",
    title: "",
    puzzleText: "",
    puzzleImageUrl: "",
    hiddenMessage: "",
    sortOrder: "100",
    isActive: true,
    answersText: ""
  };
}

function toPayload(room: EditableRoom) {
  return {
    id: room.id,
    problemId: room.problemId || null,
    roomCode: room.roomCode,
    exploreType: room.exploreType,
    title: room.title,
    puzzleText: room.puzzleText,
    puzzleImageUrl: room.puzzleImageUrl,
    hiddenMessage: room.hiddenMessage,
    sortOrder: room.sortOrder,
    isActive: room.isActive,
    answers: room.answersText.split(/\r?\n/)
  };
}
