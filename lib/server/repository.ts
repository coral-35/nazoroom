import type {
  ExploredRoomCard,
  ExplorationLogRecord,
  ExploreResultType,
  PlayerRecord,
  PlayerTreasureRecord,
  RoomAnswerRecord,
  RoomRecord,
  UnlockAttemptRecord,
  UnlockResult,
  EventRecord
} from "@/lib/types/app";
import type { AdminRoomRecord, ExploreType } from "@/lib/types/app";

export type CreateExplorationLogInput = {
  eventId: string;
  playerId: string;
  roomId: string | null;
  inputRoomCode: string;
  normalizedRoomCode: string;
  resultType: ExploreResultType;
  message: string;
};

export type CreateUnlockAttemptInput = {
  eventId: string;
  playerId: string;
  roomId: string | null;
  inputRoomCode: string;
  normalizedRoomCode: string;
  inputAnswer: string;
  normalizedAnswer: string;
  result: UnlockResult;
};

export type CreateTreasureInput = {
  eventId: string;
  playerId: string;
  room: RoomRecord;
};

export type UpdateEventInput = {
  eventId: string;
  status: EventRecord["status"];
  startsAt: string | null;
  endsAt: string | null;
};

export type UpsertRoomInput = {
  eventId: string;
  roomId?: string;
  roomCode: string;
  normalizedRoomCode: string;
  exploreType: ExploreType;
  title: string | null;
  puzzleText: string | null;
  puzzleImageUrl: string | null;
  hiddenMessage: string | null;
  treasureName: string;
  treasureDescription: string | null;
  sortOrder: number;
  isActive: boolean;
  answers: {
    answerText: string;
    normalizedAnswer: string;
  }[];
};

export type NazoroomRepository = {
  getEvent(eventId: string): Promise<EventRecord | null>;
  updateEvent(input: UpdateEventInput): Promise<EventRecord>;
  resetEventProgress(input: UpdateEventInput): Promise<EventRecord>;
  upsertPlayer(eventId: string, nickname: string): Promise<PlayerRecord>;
  getPlayer(eventId: string, playerId: string): Promise<PlayerRecord | null>;
  getRoomByNormalizedCode(
    eventId: string,
    normalizedRoomCode: string
  ): Promise<RoomRecord | null>;
  createExplorationLog(input: CreateExplorationLogInput): Promise<ExplorationLogRecord>;
  listExplorationCards(eventId: string, playerId: string): Promise<ExploredRoomCard[]>;
  listPlayerTreasures(eventId: string, playerId: string): Promise<PlayerTreasureRecord[]>;
  listRoomAnswers(roomId: string): Promise<Pick<RoomAnswerRecord, "normalizedAnswer">[]>;
  createUnlockAttempt(input: CreateUnlockAttemptInput): Promise<UnlockAttemptRecord>;
  getPlayerTreasure(
    eventId: string,
    playerId: string,
    roomId: string
  ): Promise<PlayerTreasureRecord | null>;
  createPlayerTreasureIdempotent(
    input: CreateTreasureInput
  ): Promise<{ treasure: PlayerTreasureRecord; created: boolean }>;
  listPlayers(eventId: string): Promise<PlayerRecord[]>;
  listRooms(eventId: string): Promise<RoomRecord[]>;
  listAdminRooms(eventId: string): Promise<AdminRoomRecord[]>;
  upsertRoom(input: UpsertRoomInput): Promise<AdminRoomRecord>;
  listAllTreasures(eventId: string): Promise<PlayerTreasureRecord[]>;
};

export function buildExploredRoomCard(input: {
  log: ExplorationLogRecord;
  room: RoomRecord | null;
  unlocked: boolean;
}): ExploredRoomCard {
  const { log, room, unlocked } = input;
  return {
    logId: log.id,
    roomCode: room?.roomCode ?? log.inputRoomCode,
    resultType: log.resultType,
    title: room?.title ?? undefined,
    message: log.message,
    puzzleText: log.resultType === "show_puzzle" ? room?.puzzleText ?? undefined : undefined,
    puzzleImageUrl:
      log.resultType === "show_puzzle" ? room?.puzzleImageUrl ?? undefined : undefined,
    createdAt: log.createdAt,
    unlocked
  };
}
