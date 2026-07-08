export const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

export type EventStatus = "draft" | "active" | "ended";
export type ExploreType = "hidden_clue" | "show_puzzle";
export type ExploreResultType = "not_found" | ExploreType;
export type UnlockResult =
  | "correct"
  | "incorrect"
  | "expired"
  | "already_unlocked"
  | "room_not_found";

export type EventRecord = {
  id: string;
  title: string;
  status: EventStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PlayerRecord = {
  id: string;
  eventId: string;
  nickname: string;
  createdAt: string;
};

export type RoomRecord = {
  id: string;
  eventId: string;
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
  createdAt?: string;
  updatedAt?: string;
};

export type RoomAnswerRecord = {
  id: string;
  roomId: string;
  answerText: string;
  normalizedAnswer: string;
  createdAt: string;
};

export type ExplorationLogRecord = {
  id: string;
  eventId: string;
  playerId: string;
  roomId: string | null;
  inputRoomCode: string;
  normalizedRoomCode: string;
  resultType: ExploreResultType;
  message: string;
  createdAt: string;
};

export type PlayerTreasureRecord = {
  id: string;
  eventId: string;
  playerId: string;
  roomId: string;
  roomCode: string;
  treasureName: string;
  treasureDescription: string | null;
  unlockedAt: string;
};

export type UnlockAttemptRecord = {
  id: string;
  eventId: string;
  playerId: string;
  roomId: string | null;
  inputRoomCode: string;
  normalizedRoomCode: string;
  inputAnswer: string;
  normalizedAnswer: string;
  result: UnlockResult;
  createdAt: string;
};

export type ExploredRoomCard = {
  logId: string;
  roomCode: string;
  resultType: ExploreResultType;
  title?: string;
  message: string;
  puzzleText?: string;
  puzzleImageUrl?: string;
  createdAt: string;
  unlocked?: boolean;
};

export type TreasureItem = {
  roomCode: string;
  name: string;
  description: string | null;
  unlockedAt: string;
};

export type TreasureScore = {
  roomCode: string;
  treasureName: string;
  ownerCount: number;
  score: number;
};

export type RankingRow = {
  playerId: string;
  nickname: string;
  score: number;
  treasureCount: number;
  lastUnlockedAt: string | null;
  treasures: string[];
};

export type RankingResponse = {
  totalPlayers: number;
  treasureScores: TreasureScore[];
  ranking: RankingRow[];
};

export type PublicEvent = EventRecord & {
  serverNow?: string;
};

export type JoinResponse = {
  player: Pick<PlayerRecord, "id" | "nickname">;
  event: PublicEvent;
};

export type StateResponse = {
  event: PublicEvent;
  player: Pick<PlayerRecord, "id" | "nickname">;
  explorationLogs: ExploredRoomCard[];
  treasures: TreasureItem[];
  ranking: RankingResponse | null;
};

export type ExploreResponse = {
  resultType: ExploreResultType;
  message: string;
  room: null | {
    roomCode: string;
    title: string | null;
    puzzleText?: string | null;
    puzzleImageUrl?: string | null;
    displayMode: "hidden" | "visible";
  };
  card: ExploredRoomCard;
};

export type UnlockResponse = {
  result: UnlockResult;
  message: string;
  treasure?: {
    roomCode: string;
    name: string;
    description: string | null;
    unlockedAt: string;
  };
};
