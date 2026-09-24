"use client";

import { useMemo, useState } from "react";
import type {
  AdminRoomsResponse,
  AdminRoomRecord,
  ProblemBankRecord
} from "@/lib/types/app";

type AdminRoomEditorProps = {
  eventId: string;
  apiBasePath?: string;
  initialRooms: AdminRoomRecord[];
  initialProblems?: ProblemBankRecord[];
};

type EditableProblem = {
  id: string;
  problemNumber: number;
  roomCode: string;
  puzzleImageUrl: string;
  answersText: string;
  imageFile: File | null;
};

type AssignmentRow = {
  problemId: string;
  roomId?: string;
  roomCode: string;
  answersText: string;
  isActive: boolean;
};

export function AdminRoomEditor({
  eventId,
  apiBasePath = `/api/admin/events/${eventId}`,
  initialRooms,
  initialProblems = []
}: AdminRoomEditorProps) {
  const [problems, setProblems] = useState(initialProblems.map(toEditableProblem));
  const [assignments, setAssignments] = useState(() =>
    buildAssignments(initialProblems, initialRooms)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentRow[]>([]);

  const problemById = useMemo(
    () => new Map(problems.map((problem) => [problem.id, problem])),
    [problems]
  );

  async function saveProblem(problem: EditableProblem) {
    setBusyKey(problem.id);
    setError(null);
    setMessage(null);

    try {
      const body = problem.imageFile ? buildProblemFormData(problem) : null;
      const response = await fetch(`${apiBasePath}/problem-bank`, {
        method: "POST",
        headers: body ? undefined : { "content-type": "application/json" },
        body: body ?? JSON.stringify(problemPayload(problem))
      });
      const data = (await response.json()) as AdminRoomsResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "問題を保存できませんでした。");
      }

      applyResponse(data as AdminRoomsResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "通信に失敗しました。");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveAssignments(rows: AssignmentRow[]) {
    setBusyKey("assignments");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${apiBasePath}/assignments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignments: rows.map((assignment) => ({
            problemId: assignment.problemId,
            roomId: assignment.roomId,
            isActive: assignment.isActive
          }))
        })
      });
      const data = (await response.json()) as AdminRoomsResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "表示順を保存できませんでした。");
      }

      applyResponse(data as AdminRoomsResponse);
      setOrganizing(false);
      setAssignmentDraft([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "通信に失敗しました。");
    } finally {
      setBusyKey(null);
    }
  }

  function applyResponse(response: AdminRoomsResponse) {
    const nextProblems = response.problems.map(toEditableProblem);
    setProblems(nextProblems);
    setAssignments(buildAssignments(response.problems, response.rooms));
    setMessage(response.message ?? "保存しました。");
  }

  function openOrganizer() {
    setAssignmentDraft(assignments.map((assignment) => ({ ...assignment })));
    setOrganizing(true);
    setError(null);
    setMessage(null);
  }

  function closeOrganizer() {
    setAssignmentDraft([]);
    setOrganizing(false);
  }

  function patchProblem(index: number, patch: Partial<EditableProblem>) {
    setProblems((current) =>
      current.map((problem, problemIndex) =>
        problemIndex === index ? { ...problem, ...patch } : problem
      )
    );
  }

  function patchAssignmentDraft(index: number, patch: Partial<AssignmentRow>) {
    setAssignmentDraft((current) =>
      current.map((assignment, assignmentIndex) =>
        assignmentIndex === index ? { ...assignment, ...patch } : assignment
      )
    );
  }

  function moveAssignmentDraft(index: number, delta: -1 | 1) {
    setAssignmentDraft((current) => {
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [row] = next.splice(index, 1);
      next.splice(nextIndex, 0, row);
      return next;
    });
  }

  return (
    <section className="panel section-gap">
      <div className="panel-header">
        <div>
          <p className="kicker">問題DB</p>
          <h2 className="card-title">問題登録</h2>
        </div>
      </div>
      <p className="lead lead--small">
        謎画像、解答、部屋番号を1組として保存します。画像はファイル選択で差し替えます。解答は改行区切りです。
      </p>

      {message ? <p className="message message--notice">{message}</p> : null}
      {error ? <p className="message message--error">{error}</p> : null}

      <div className="admin-room-list">
        {problems.map((problem, index) => (
          <ProblemForm
            key={problem.id}
            problem={problem}
            busy={busyKey === problem.id}
            onChange={(patch) => patchProblem(index, patch)}
            onSave={() => saveProblem(problem)}
          />
        ))}
      </div>

      <div className="panel section-gap">
        <div className="panel-header">
          <div>
            <p className="kicker">採用設定</p>
            <h2 className="card-title">表示順と宝の割当</h2>
          </div>
          <button
            type="button"
            className="button button--primary button--compact"
            disabled={busyKey === "assignments" || assignments.length === 0}
            onClick={openOrganizer}
          >
            表示順と採用をまとめて編集
          </button>
        </div>
        {organizing ? (
          <AssignmentOrganizer
            rows={assignmentDraft}
            problemById={problemById}
            busy={busyKey === "assignments"}
            onChange={patchAssignmentDraft}
            onMove={moveAssignmentDraft}
            onSave={() => saveAssignments(assignmentDraft)}
            onCancel={closeOrganizer}
          />
        ) : (
          <AssignmentSummary rows={assignments} problemById={problemById} />
        )}
      </div>
    </section>
  );
}

function ProblemForm({
  problem,
  busy,
  onChange,
  onSave
}: {
  problem: EditableProblem;
  busy: boolean;
  onChange: (patch: Partial<EditableProblem>) => void;
  onSave: () => void;
}) {
  return (
    <form
      className="admin-room-card"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="card-header">
        <div>
          <p className="kicker">問題 {problem.problemNumber}</p>
          <h3 className="card-title">部屋 {problem.roomCode || "未設定"}</h3>
        </div>
        <button type="submit" className="button button--primary button--compact" disabled={busy}>
          {busy ? "保存中..." : "保存"}
        </button>
      </div>
      <div className="admin-room-fields">
        <label className="field">
          部屋番号
          <input
            value={problem.roomCode}
            onChange={(event) => onChange({ roomCode: event.target.value })}
            className="input"
            placeholder="305"
          />
        </label>
        <label className="field field--full">
          画像ファイル
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => onChange({ imageFile: event.target.files?.[0] ?? null })}
            className="input"
          />
        </label>
        <label className="field field--full">
          解答（改行区切り）
          <textarea
            value={problem.answersText}
            onChange={(event) => onChange({ answersText: event.target.value })}
            className="input input--textarea"
            placeholder={"ひかり\nヒカリ"}
          />
        </label>
        {problem.puzzleImageUrl ? (
          <div className="admin-problem-preview field--full">
            <img src={problem.puzzleImageUrl} alt="" />
          </div>
        ) : null}
      </div>
    </form>
  );
}

function AssignmentSummary({
  rows,
  problemById
}: {
  rows: AssignmentRow[];
  problemById: Map<string, EditableProblem>;
}) {
  return (
    <div className="admin-room-list">
      {rows.map((assignment, index) => {
        const activeOrder = assignment.isActive
          ? rows.slice(0, index + 1).filter((row) => row.isActive).length
          : 0;
        const problem = problemById.get(assignment.problemId);
        const roomCode = problem?.roomCode ?? assignment.roomCode;
        const answersText = problem?.answersText ?? assignment.answersText;

        return (
          <div
            className="admin-room-card admin-assignment-row"
            key={assignment.problemId}
          >
            <div className="admin-assignment-treasure">
              <span className="kicker">
                {assignment.isActive ? treasureLabel(activeOrder) : "未採用"}
              </span>
            </div>
            <label className="field admin-assignment-room">
              部屋番号
              <input value={roomCode} className="input" readOnly />
            </label>
            <label className="field admin-assignment-answer">
              解答
              <input value={answersText.replace(/\r?\n/g, " / ")} className="input" readOnly />
            </label>
            <div className="admin-assignment-actions">
              <span className="muted">{assignment.isActive ? "採用中" : "候補"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssignmentOrganizer({
  rows,
  problemById,
  busy,
  onChange,
  onMove,
  onSave,
  onCancel
}: {
  rows: AssignmentRow[];
  problemById: Map<string, EditableProblem>;
  busy: boolean;
  onChange: (index: number, patch: Partial<AssignmentRow>) => void;
  onMove: (index: number, delta: -1 | 1) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="admin-assignment-organizer">
      <p className="lead lead--small">
        この画面内で順番と採用状態をまとめて調整し、確定時に一括保存します。採用中の行に上から順に宝A〜Zが割り当たります。
      </p>
      <div className="admin-room-list">
        {rows.map((assignment, index) => {
          const activeOrder = assignment.isActive
            ? rows.slice(0, index + 1).filter((row) => row.isActive).length
            : 0;
          const problem = problemById.get(assignment.problemId);

          return (
            <AssignmentForm
              key={assignment.problemId}
              row={{
                ...assignment,
                roomCode: problem?.roomCode ?? assignment.roomCode,
                answersText: problem?.answersText ?? assignment.answersText
              }}
              index={index}
              activeOrder={activeOrder}
              onChange={(patch) => onChange(index, patch)}
              onMove={onMove}
            />
          );
        })}
      </div>
      <div className="action-row">
        <button
          type="button"
          className="button button--primary button--compact"
          disabled={busy}
          onClick={onSave}
        >
          {busy ? "保存中..." : "確定して保存"}
        </button>
        <button
          type="button"
          className="button button--secondary button--compact"
          disabled={busy}
          onClick={onCancel}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

function AssignmentForm({
  row,
  index,
  activeOrder,
  onChange,
  onMove
}: {
  row: AssignmentRow;
  index: number;
  activeOrder: number;
  onChange: (patch: Partial<AssignmentRow>) => void;
  onMove: (index: number, delta: -1 | 1) => void;
}) {
  return (
    <div className="admin-room-card admin-assignment-row">
      <div className="admin-assignment-treasure">
        <span className="kicker">{row.isActive ? treasureLabel(activeOrder) : "未採用"}</span>
      </div>
      <label className="field admin-assignment-room">
        部屋番号
        <input value={row.roomCode} className="input" readOnly />
      </label>
      <label className="field admin-assignment-answer">
        解答
        <input value={row.answersText.replace(/\r?\n/g, " / ")} className="input" readOnly />
      </label>
      <div className="admin-assignment-actions">
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={row.isActive}
            onChange={(event) => onChange({ isActive: event.target.checked })}
          />
          採用
        </label>
        <button
          type="button"
          className="button button--secondary button--tiny"
          onClick={() => onMove(index, -1)}
        >
          上へ
        </button>
        <button
          type="button"
          className="button button--secondary button--tiny"
          onClick={() => onMove(index, 1)}
        >
          下へ
        </button>
      </div>
    </div>
  );
}

function toEditableProblem(problem: ProblemBankRecord): EditableProblem {
  return {
    id: problem.id,
    problemNumber: problem.problemNumber,
    roomCode: problem.roomCode,
    puzzleImageUrl: problem.puzzleImageUrl,
    answersText: problem.defaultAnswers.join("\n"),
    imageFile: null
  };
}

function problemPayload(problem: EditableProblem) {
  return {
    id: problem.id,
    roomCode: problem.roomCode,
    puzzleImageUrl: problem.puzzleImageUrl,
    answers: problem.answersText.split(/\r?\n/)
  };
}

function buildProblemFormData(problem: EditableProblem) {
  const formData = new FormData();
  formData.set("id", problem.id);
  formData.set("roomCode", problem.roomCode);
  formData.set("puzzleImageUrl", problem.puzzleImageUrl);
  formData.set("answers", problem.answersText);
  if (problem.imageFile) {
    formData.set("image", problem.imageFile);
  }

  return formData;
}

function buildAssignments(
  problems: ProblemBankRecord[],
  rooms: AdminRoomRecord[]
): AssignmentRow[] {
  const roomByProblemId = new Map(
    rooms
      .filter((room) => room.problemId)
      .map((room) => [room.problemId as string, room])
  );

  return [...problems]
    .sort((a, b) => {
      const roomA = roomByProblemId.get(a.id);
      const roomB = roomByProblemId.get(b.id);
      const orderA = roomA?.isActive ? roomA.sortOrder : Number.MAX_SAFE_INTEGER;
      const orderB = roomB?.isActive ? roomB.sortOrder : Number.MAX_SAFE_INTEGER;
      return orderA - orderB || a.problemNumber - b.problemNumber;
    })
    .map((problem) => {
      const room = roomByProblemId.get(problem.id);
      return {
        problemId: problem.id,
        roomId: room?.id,
        roomCode: problem.roomCode,
        answersText: problem.defaultAnswers.join("\n"),
        isActive: room?.isActive ?? false
      };
    });
}

function treasureLabel(order: number) {
  if (!Number.isInteger(order) || order < 1 || order > 26) {
    return "宝未割当";
  }

  return `宝${String.fromCharCode(64 + order)}`;
}
