import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";
import { sortExploredRoomCards } from "@/lib/domain/explorationCards";
import type {
  EventRecord,
  ExplorationLogRecord,
  PlayerRecord,
  PlayerTreasureRecord,
  RoomAnswerRecord,
  RoomRecord,
  UnlockAttemptRecord
} from "@/lib/types/app";
import {
  buildExploredRoomCard,
  type CreateTreasureInput,
  type NazoroomRepository,
  type UpdateEventInput,
  type UpsertRoomInput
} from "@/lib/server/repository";

export type MemoryState = {
  events: EventRecord[];
  players: PlayerRecord[];
  rooms: RoomRecord[];
  roomAnswers: RoomAnswerRecord[];
  explorationLogs: ExplorationLogRecord[];
  playerTreasures: PlayerTreasureRecord[];
  unlockAttempts: UnlockAttemptRecord[];
};

type MemoryRepositoryOptions = {
  persistPath?: string;
};

const ROOM_305_ID = "10000000-0000-0000-0000-000000000001";
const ROOM_204_ID = "10000000-0000-0000-0000-000000000002";
const ROOM_A01_ID = "10000000-0000-0000-0000-000000000003";

export function createSeedMemoryState(now: Date = new Date()): MemoryState {
  const startsAt = new Date(now.getTime() - 5 * 60_000).toISOString();
  const endsAt = new Date(now.getTime() + 60 * 60_000).toISOString();
  const createdAt = now.toISOString();

  return {
    events: [
      {
        id: DEFAULT_EVENT_ID,
        title: "MVPテスト宝探し",
        status: "active",
        startsAt,
        endsAt,
        createdAt,
        updatedAt: createdAt
      }
    ],
    players: [],
    rooms: [
      {
        id: ROOM_305_ID,
        eventId: DEFAULT_EVENT_ID,
        roomCode: "305",
        normalizedRoomCode: "305",
        exploreType: "show_puzzle",
        title: "古びた時計の暗号",
        puzzleText: "時計の針が示す言葉を読め。",
        puzzleImageUrl: null,
        hiddenMessage: null,
        treasureName: "月の鍵",
        treasureDescription: "淡く光る銀色の鍵。",
        sortOrder: 1,
        isActive: true,
        createdAt,
        updatedAt: createdAt
      },
      {
        id: ROOM_204_ID,
        eventId: DEFAULT_EVENT_ID,
        roomCode: "204",
        normalizedRoomCode: "204",
        exploreType: "hidden_clue",
        title: "現地探索型の謎",
        puzzleText: null,
        puzzleImageUrl: null,
        hiddenMessage: "部屋204の周囲に、画面には映らない違和感がある。",
        treasureName: "星の鍵",
        treasureDescription: "小さな星形の鍵。",
        sortOrder: 2,
        isActive: true,
        createdAt,
        updatedAt: createdAt
      },
      {
        id: ROOM_A01_ID,
        eventId: DEFAULT_EVENT_ID,
        roomCode: "A-01",
        normalizedRoomCode: "A-01",
        exploreType: "show_puzzle",
        title: "封筒の記号",
        puzzleText: "封筒に描かれた線を順にたどれ。",
        puzzleImageUrl: null,
        hiddenMessage: null,
        treasureName: "太陽の鍵",
        treasureDescription: "あたたかく光る金色の鍵。",
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
    playerTreasures: [],
    unlockAttempts: []
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
      state.playerTreasures = state.playerTreasures.filter(
        (treasure) => treasure.eventId !== input.eventId
      );
      state.unlockAttempts = state.unlockAttempts.filter(
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

    async createExplorationLog(input) {
      readLatest();
      const log: ExplorationLogRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...input
      };
      state.explorationLogs.push(log);
      persist();
      return log;
    },

    async listExplorationCards(eventId, playerId) {
      readLatest();
      const unlockedRoomIds = new Set(
        state.playerTreasures
          .filter(
            (treasure) =>
              treasure.eventId === eventId && treasure.playerId === playerId
          )
          .map((treasure) => treasure.roomId)
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
            unlocked: log.roomId ? unlockedRoomIds.has(log.roomId) : false
          })
        );

      return sortExploredRoomCards(cards);
    },

    async listPlayerTreasures(eventId, playerId) {
      readLatest();
      return state.playerTreasures
        .filter(
          (treasure) =>
            treasure.eventId === eventId && treasure.playerId === playerId
        )
        .sort(
          (a, b) =>
            new Date(a.unlockedAt).getTime() - new Date(b.unlockedAt).getTime()
        );
    },

    async listRoomAnswers(roomId) {
      readLatest();
      return state.roomAnswers
        .filter((answer) => answer.roomId === roomId)
        .map((answer) => ({ normalizedAnswer: answer.normalizedAnswer }));
    },

    async createUnlockAttempt(input) {
      readLatest();
      const attempt: UnlockAttemptRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...input
      };
      state.unlockAttempts.push(attempt);
      persist();
      return attempt;
    },

    async getPlayerTreasure(eventId, playerId, roomId) {
      readLatest();
      return (
        state.playerTreasures.find(
          (treasure) =>
            treasure.eventId === eventId &&
            treasure.playerId === playerId &&
            treasure.roomId === roomId
        ) ?? null
      );
    },

    async createPlayerTreasureIdempotent(input) {
      readLatest();
      const existing = await this.getPlayerTreasure(
        input.eventId,
        input.playerId,
        input.room.id
      );
      if (existing) {
        return { treasure: existing, created: false };
      }

      const treasure = makeTreasure(input);
      state.playerTreasures.push(treasure);
      persist();
      return { treasure, created: true };
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

    async listAllTreasures(eventId) {
      readLatest();
      return state.playerTreasures
        .filter((treasure) => treasure.eventId === eventId)
        .sort((a, b) => a.unlockedAt.localeCompare(b.unlockedAt));
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
        roomCode: input.roomCode,
        normalizedRoomCode: input.normalizedRoomCode,
        exploreType: input.exploreType,
        title: input.title,
        puzzleText: input.puzzleText,
        puzzleImageUrl: input.puzzleImageUrl,
        hiddenMessage: input.hiddenMessage,
        treasureName: input.treasureName,
        treasureDescription: input.treasureDescription,
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
      roomCode: input.roomCode,
      normalizedRoomCode: input.normalizedRoomCode,
      exploreType: input.exploreType,
      title: input.title,
      puzzleText: input.puzzleText,
      puzzleImageUrl: input.puzzleImageUrl,
      hiddenMessage: input.hiddenMessage,
      treasureName: input.treasureName,
      treasureDescription: input.treasureDescription,
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

function makeTreasure(input: CreateTreasureInput): PlayerTreasureRecord {
  return {
    id: crypto.randomUUID(),
    eventId: input.eventId,
    playerId: input.playerId,
    roomId: input.room.id,
    roomCode: input.room.roomCode,
    treasureName: input.room.treasureName,
    treasureDescription: input.room.treasureDescription,
    unlockedAt: new Date().toISOString()
  };
}
