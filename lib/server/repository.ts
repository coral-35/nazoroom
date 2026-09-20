import type {
  ExploredRoomCard,
  ExplorationLogRecord,
  ExploreResultType,
  PlayerRecord,
  PlayerClearRecord,
  RoomAnswerRecord,
  RoomRecord,
  AnswerAttemptRecord,
  AnswerResult,
  EventRecord
} from "@/lib/types/app";
import type { AdminRoomRecord, ExploreType, ProblemBankRecord } from "@/lib/types/app";

export type CreateExplorationLogInput = {
  eventId: string;
  playerId: string;
  roomId: string | null;
  inputRoomCode: string;
  normalizedRoomCode: string;
  resultType: ExploreResultType;
  message: string;
};

export type CreateAnswerAttemptInput = {
  eventId: string;
  playerId: string;
  roomId: string | null;
  inputRoomCode: string;
  normalizedRoomCode: string;
  inputAnswer: string;
  normalizedAnswer: string;
  result: AnswerResult;
};

export type CreateClearInput = {
  eventId: string;
  playerId: string;
  room: RoomRecord;
};

export type UpdateEventInput = {
  eventId: string;
  status: EventRecord["status"];
  startsAt: string | null;
  endsAt: string | null;
  durationMinutes: number;
};

export type UpsertRoomInput = {
  eventId: string;
  roomId?: string;
  problemId: string | null;
  roomCode: string;
  normalizedRoomCode: string;
  exploreType: ExploreType;
  title: string | null;
  puzzleText: string | null;
  puzzleImageUrl: string | null;
  hiddenMessage: string | null;
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
  createExplorationLogIdempotent(
    input: CreateExplorationLogInput
  ): Promise<{ log: ExplorationLogRecord; created: boolean }>;
  listExplorationCards(eventId: string, playerId: string): Promise<ExploredRoomCard[]>;
  listPlayerClears(eventId: string, playerId: string): Promise<PlayerClearRecord[]>;
  listRoomAnswers(roomId: string): Promise<Pick<RoomAnswerRecord, "normalizedAnswer">[]>;
  createAnswerAttempt(input: CreateAnswerAttemptInput): Promise<AnswerAttemptRecord>;
  getPlayerClear(
    eventId: string,
    playerId: string,
    roomId: string
  ): Promise<PlayerClearRecord | null>;
  createPlayerClearIdempotent(
    input: CreateClearInput
  ): Promise<{ clearedRoom: PlayerClearRecord; created: boolean }>;
  listPlayers(eventId: string): Promise<PlayerRecord[]>;
  listRooms(eventId: string): Promise<RoomRecord[]>;
  listAdminRooms(eventId: string): Promise<AdminRoomRecord[]>;
  listProblemBank(): Promise<ProblemBankRecord[]>;
  upsertRoom(input: UpsertRoomInput): Promise<AdminRoomRecord>;
  listAllClears(eventId: string): Promise<PlayerClearRecord[]>;
};

export function buildExploredRoomCard(input: {
  log: ExplorationLogRecord;
  room: RoomRecord | null;
  cleared: boolean;
}): ExploredRoomCard {
  const { log, room, cleared } = input;
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
    cleared
  };
}
