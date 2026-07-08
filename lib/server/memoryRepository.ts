import { DEFAULT_EVENT_ID } from "@/lib/types/app";
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
  type NazoroomRepository
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
  initialState: MemoryState = createSeedMemoryState()
): NazoroomRepository {
  const state = initialState;

  return {
    async getEvent(eventId) {
      return state.events.find((event) => event.id === eventId) ?? null;
    },

    async upsertPlayer(eventId, nickname) {
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
      return player;
    },

    async getPlayer(eventId, playerId) {
      return (
        state.players.find(
          (player) => player.eventId === eventId && player.id === playerId
        ) ?? null
      );
    },

    async getRoomByNormalizedCode(eventId, normalizedRoomCode) {
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
      const log: ExplorationLogRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...input
      };
      state.explorationLogs.push(log);
      return log;
    },

    async listExplorationCards(eventId, playerId) {
      const unlockedRoomIds = new Set(
        state.playerTreasures
          .filter(
            (treasure) =>
              treasure.eventId === eventId && treasure.playerId === playerId
          )
          .map((treasure) => treasure.roomId)
      );

      return state.explorationLogs
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
    },

    async listPlayerTreasures(eventId, playerId) {
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
      return state.roomAnswers
        .filter((answer) => answer.roomId === roomId)
        .map((answer) => ({ normalizedAnswer: answer.normalizedAnswer }));
    },

    async createUnlockAttempt(input) {
      const attempt: UnlockAttemptRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...input
      };
      state.unlockAttempts.push(attempt);
      return attempt;
    },

    async getPlayerTreasure(eventId, playerId, roomId) {
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
      return { treasure, created: true };
    },

    async listPlayers(eventId) {
      return state.players
        .filter((player) => player.eventId === eventId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async listRooms(eventId) {
      return state.rooms
        .filter((room) => room.eventId === eventId && room.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },

    async listAllTreasures(eventId) {
      return state.playerTreasures
        .filter((treasure) => treasure.eventId === eventId)
        .sort((a, b) => a.unlockedAt.localeCompare(b.unlockedAt));
    }
  };
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
