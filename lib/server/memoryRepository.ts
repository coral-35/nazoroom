import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";
import { sortExploredRoomCards } from "@/lib/domain/explorationCards";
import type {
  EventRecord,
  ExplorationLogRecord,
  PlayerRecord,
  PlayerClearRecord,
  ProblemBankRecord,
  RoomAnswerRecord,
  RoomRecord,
  AnswerAttemptRecord
} from "@/lib/types/app";
import {
  buildExploredRoomCard,
  type CreateClearInput,
  type NazoroomRepository,
  type UpdateEventInput,
  type UpsertRoomInput
} from "@/lib/server/repository";

export type MemoryState = {
  events: EventRecord[];
  players: PlayerRecord[];
  problemBank: ProblemBankRecord[];
  rooms: RoomRecord[];
  roomAnswers: RoomAnswerRecord[];
  explorationLogs: ExplorationLogRecord[];
  playerClears: PlayerClearRecord[];
  answerAttempts: AnswerAttemptRecord[];
};

type MemoryRepositoryOptions = {
  persistPath?: string;
};

const ROOM_305_ID = "10000000-0000-0000-0000-000000000001";
const ROOM_204_ID = "10000000-0000-0000-0000-000000000002";
const ROOM_A01_ID = "10000000-0000-0000-0000-000000000003";
const PROBLEM_001_ID = "20000000-0000-0000-0000-000000000001";
const PROBLEM_002_ID = "20000000-0000-0000-0000-000000000002";
const PROBLEM_003_ID = "20000000-0000-0000-0000-000000000003";

export function createSeedMemoryState(now: Date = new Date()): MemoryState {
  const startsAt = new Date(now.getTime() - 5 * 60_000).toISOString();
  const createdAt = now.toISOString();

  return {
    events: [
      {
        id: DEFAULT_EVENT_ID,
        title: "謎解きダンジョン",
        status: "active",
        startsAt,
        endsAt: null,
        durationMinutes: 60,
        createdAt,
        updatedAt: createdAt
      }
    ],
    players: [],
    problemBank: createProblemBank(createdAt),
    rooms: [
      {
        id: ROOM_305_ID,
        eventId: DEFAULT_EVENT_ID,
        problemId: PROBLEM_001_ID,
        roomCode: "305",
        normalizedRoomCode: "305",
        exploreType: "show_puzzle",
        title: "古びた時計の暗号",
        puzzleText: "時計の針が示す言葉を読め。",
        puzzleImageUrl: "/puzzles/frame-01.png",
        hiddenMessage: null,
        sortOrder: 1,
        isActive: true,
        createdAt,
        updatedAt: createdAt
      },
      {
        id: ROOM_204_ID,
        eventId: DEFAULT_EVENT_ID,
        problemId: PROBLEM_002_ID,
        roomCode: "204",
        normalizedRoomCode: "204",
        exploreType: "hidden_clue",
        title: "現地探索型の謎",
        puzzleText: null,
        puzzleImageUrl: null,
        hiddenMessage: "部屋204の周囲に、画面には映らない違和感がある。",
        sortOrder: 2,
        isActive: true,
        createdAt,
        updatedAt: createdAt
      },
      {
        id: ROOM_A01_ID,
        eventId: DEFAULT_EVENT_ID,
        problemId: PROBLEM_003_ID,
        roomCode: "101",
        normalizedRoomCode: "101",
        exploreType: "show_puzzle",
        title: "封筒の記号",
        puzzleText: "封筒に描かれた線を順にたどれ。",
        puzzleImageUrl: "/puzzles/frame-03.png",
        hiddenMessage: null,
        sortOrder: 3,
        isActive: true,
        createdAt,
        updatedAt: createdAt
      }
    ],
    roomAnswers: [
      createAnswer(ROOM_305_ID, "ひかり", "ひかり", createdAt),
      createAnswer(ROOM_204_ID, "ほし", "ほし", createdAt),
      createAnswer(ROOM_A01_ID, "たいよう", "たいよう", createdAt)
    ],
    explorationLogs: [],
    playerClears: [],
    answerAttempts: []
  };
}

export function createMemoryRepository(
  initialState: MemoryState = createSeedMemoryState(),
  options: MemoryRepositoryOptions = {}
): NazoroomRepository {
  let state = loadState(options.persistPath) ?? initialState;

  return {
    async getEvent(eventId) {
      readLatest();
      return state.events.find((event) => event.id === eventId) ?? null;
    },

    async updateEvent(input) {
      readLatest();
      const event = updateMemoryEvent(input);
      persist();
      return event;
    },

    async resetEventProgress(input) {
      readLatest();
      state.players = state.players.filter((player) => player.eventId !== input.eventId);
      state.explorationLogs = state.explorationLogs.filter(
        (log) => log.eventId !== input.eventId
      );
      state.playerClears = state.playerClears.filter(
        (clear) => clear.eventId !== input.eventId
      );
      state.answerAttempts = state.answerAttempts.filter(
        (attempt) => attempt.eventId !== input.eventId
      );
      const event = updateMemoryEvent(input);
      persist();
      return event;
    },

    async upsertPlayer(eventId, nickname) {
      readLatest();
      const existing = state.players.find(
        (player) => player.eventId === eventId && player.nickname === nickname
      );
      if (existing) {
        return existing;
      }

      const player: PlayerRecord = {
        id: crypto.randomUUID(),
        eventId,
        nickname,
        createdAt: new Date().toISOString()
      };
      state.players.push(player);
      persist();
      return player;
    },

    async getPlayer(eventId, playerId) {
      readLatest();
      return (
        state.players.find(
          (player) => player.eventId === eventId && player.id === playerId
        ) ?? null
      );
    },

    async getRoomByNormalizedCode(eventId, normalizedRoomCode) {
      readLatest();
      return (
        state.rooms.find(
          (room) =>
            room.eventId === eventId &&
            room.normalizedRoomCode === normalizedRoomCode &&
            room.isActive
        ) ?? null
      );
    },

    async createExplorationLogIdempotent(input) {
      readLatest();
      const existing = state.explorationLogs.find(
        (log) =>
          log.playerId === input.playerId &&
          log.roomId !== null &&
          log.roomId === input.roomId
      );
      if (existing) {
        return { log: existing, created: false };
      }

      const log: ExplorationLogRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...input
      };
      state.explorationLogs.push(log);
      persist();
      return { log, created: true };
    },

    async listExplorationCards(eventId, playerId) {
      readLatest();
      const clearedRoomIds = new Set(
        state.playerClears
          .filter(
            (clear) =>
              clear.eventId === eventId && clear.playerId === playerId
          )
          .map((clear) => clear.roomId)
      );

      const cards = state.explorationLogs
        .filter((log) => log.eventId === eventId && log.playerId === playerId)
        .sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .map((log) =>
          buildExploredRoomCard({
            log,
            room: state.rooms.find((room) => room.id === log.roomId) ?? null,
            cleared: log.roomId ? clearedRoomIds.has(log.roomId) : false
          })
        );

      return sortExploredRoomCards(cards);
    },

    async listPlayerClears(eventId, playerId) {
      readLatest();
      return state.playerClears
        .filter(
          (clear) =>
            clear.eventId === eventId && clear.playerId === playerId
        )
        .sort(
          (a, b) =>
            new Date(a.clearedAt).getTime() - new Date(b.clearedAt).getTime()
        );
    },

    async listRoomAnswers(roomId) {
      readLatest();
      return state.roomAnswers
        .filter((answer) => answer.roomId === roomId)
        .map((answer) => ({ normalizedAnswer: answer.normalizedAnswer }));
    },

    async createAnswerAttempt(input) {
      readLatest();
      const attempt: AnswerAttemptRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...input
      };
      state.answerAttempts.push(attempt);
      persist();
      return attempt;
    },

    async getPlayerClear(eventId, playerId, roomId) {
      readLatest();
      return (
        state.playerClears.find(
          (clear) =>
            clear.eventId === eventId &&
            clear.playerId === playerId &&
            clear.roomId === roomId
        ) ?? null
      );
    },

    async createPlayerClearIdempotent(input) {
      readLatest();
      const existing = await this.getPlayerClear(
        input.eventId,
        input.playerId,
        input.room.id
      );
      if (existing) {
        return { clearedRoom: existing, created: false };
      }

      const clearedRoom = makeClear(input);
      state.playerClears.push(clearedRoom);
      persist();
      return { clearedRoom, created: true };
    },

    async listPlayers(eventId) {
      readLatest();
      return state.players
        .filter((player) => player.eventId === eventId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async listRooms(eventId) {
      readLatest();
      return state.rooms
        .filter((room) => room.eventId === eventId && room.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },

    async listAdminRooms(eventId) {
      readLatest();
      return buildAdminRooms(eventId);
    },

    async listProblemBank() {
      readLatest();
      return [...state.problemBank].sort((a, b) => a.problemNumber - b.problemNumber);
    },

    async upsertRoom(input) {
      readLatest();
      const room = upsertMemoryRoom(input);
      state.roomAnswers = state.roomAnswers.filter(
        (answer) => answer.roomId !== room.id
      );
      state.roomAnswers.push(
        ...input.answers.map((answer) => ({
          id: crypto.randomUUID(),
          roomId: room.id,
          answerText: answer.answerText,
          normalizedAnswer: answer.normalizedAnswer,
          createdAt: new Date().toISOString()
        }))
      );
      persist();
      return buildAdminRoom(room);
    },

    async listAllClears(eventId) {
      readLatest();
      return state.playerClears
        .filter((clear) => clear.eventId === eventId)
        .sort((a, b) => a.clearedAt.localeCompare(b.clearedAt));
    }
  };

  function readLatest() {
    const persisted = loadState(options.persistPath);
    if (persisted) {
      state = persisted;
    }
  }

  function persist() {
    if (!options.persistPath) {
      return;
    }

    mkdirSync(dirname(options.persistPath), { recursive: true });
    writeFileSync(options.persistPath, JSON.stringify(state), "utf8");
  }

  function updateMemoryEvent(input: UpdateEventInput) {
    const index = state.events.findIndex((event) => event.id === input.eventId);
    if (index === -1) {
      throw new Error("Event not found.");
    }

    const current = state.events[index];
    const next: EventRecord = {
      ...current,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      durationMinutes: input.durationMinutes,
      updatedAt: new Date().toISOString()
    };
    state.events[index] = next;
    return next;
  }

  function upsertMemoryRoom(input: UpsertRoomInput) {
    const now = new Date().toISOString();
    const existingIndex = input.roomId
      ? state.rooms.findIndex(
          (room) => room.id === input.roomId && room.eventId === input.eventId
        )
      : -1;

    if (existingIndex >= 0) {
      const current = state.rooms[existingIndex];
      const next: RoomRecord = {
        ...current,
        problemId: input.problemId,
        roomCode: input.roomCode,
        normalizedRoomCode: input.normalizedRoomCode,
        exploreType: input.exploreType,
        title: input.title,
        puzzleText: input.puzzleText,
        puzzleImageUrl: input.puzzleImageUrl,
        hiddenMessage: input.hiddenMessage,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        updatedAt: now
      };
      state.rooms[existingIndex] = next;
      return next;
    }

    const room: RoomRecord = {
      id: crypto.randomUUID(),
      eventId: input.eventId,
      problemId: input.problemId,
      roomCode: input.roomCode,
      normalizedRoomCode: input.normalizedRoomCode,
      exploreType: input.exploreType,
      title: input.title,
      puzzleText: input.puzzleText,
      puzzleImageUrl: input.puzzleImageUrl,
      hiddenMessage: input.hiddenMessage,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      createdAt: now,
      updatedAt: now
    };
    state.rooms.push(room);
    return room;
  }

  function buildAdminRooms(eventId: string) {
    return state.rooms
      .filter((room) => room.eventId === eventId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.roomCode.localeCompare(b.roomCode))
      .map(buildAdminRoom);
  }

  function buildAdminRoom(room: RoomRecord) {
    return {
      ...room,
      answers: state.roomAnswers
        .filter((answer) => answer.roomId === room.id)
        .sort((a, b) => a.answerText.localeCompare(b.answerText))
    };
  }
}

function createProblemBank(createdAt: string): ProblemBankRecord[] {
  return Array.from({ length: 27 }, (_, index) => {
    const problemNumber = index + 1;
    const special = {
      1: { id: PROBLEM_001_ID, roomCode: "305", answers: ["ひかり"] },
      2: { id: PROBLEM_002_ID, roomCode: "204", answers: ["ほし"] },
      3: { id: PROBLEM_003_ID, roomCode: "101", answers: ["たいよう"] }
    }[problemNumber];

    return createProblem(
      special?.id ?? `20000000-0000-0000-0000-${String(problemNumber).padStart(12, "0")}`,
      problemNumber,
      special?.roomCode ?? String(problemNumber),
      `問題 ${problemNumber}`,
      `/puzzles/frame-${String(problemNumber).padStart(2, "0")}.png`,
      special?.answers ?? [`答え${problemNumber}`],
      createdAt
    );
  });
}

function createProblem(
  id: string,
  problemNumber: number,
  roomCode: string,
  title: string,
  puzzleImageUrl: string,
  defaultAnswers: string[],
  createdAt: string
): ProblemBankRecord {
  return {
    id,
    problemNumber,
    roomCode,
    normalizedRoomCode: roomCode,
    title,
    puzzleImageUrl,
    defaultAnswers,
    createdAt,
    updatedAt: createdAt
  };
}

function loadState(persistPath?: string): MemoryState | null {
  if (!persistPath || !existsSync(persistPath)) {
    return null;
  }

  return JSON.parse(readFileSync(persistPath, "utf8")) as MemoryState;
}

function createAnswer(
  roomId: string,
  answerText: string,
  normalizedAnswer: string,
  createdAt: string
): RoomAnswerRecord {
  return {
    id: crypto.randomUUID(),
    roomId,
    answerText,
    normalizedAnswer,
    createdAt
  };
}

function makeClear(input: CreateClearInput): PlayerClearRecord {
  return {
    id: crypto.randomUUID(),
    eventId: input.eventId,
    playerId: input.playerId,
    roomId: input.room.id,
    roomCode: input.room.roomCode,
    clearedAt: new Date().toISOString()
  };
}
