export const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

export type EventStatus = "draft" | "active" | "ended";
export type EventControlAction =
  | "start_exploration"
  | "close_exploration"
  | "publish_results"
  | "reset";
export type ExploreType = "hidden_clue" | "show_puzzle";
export type ExploreResultType = "not_found" | ExploreType;
export type AnswerResult =
  | "correct"
  | "incorrect"
  | "expired"
  | "already_cleared"
  | "room_not_found";

export type EventRecord = {
  id: string;
  title: string;
  status: EventStatus;
  startsAt: string | null;
  endsAt: string | null;
  durationMinutes: number;
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

export type AdminRoomRecord = RoomRecord & {
  answers: RoomAnswerRecord[];
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

export type PlayerClearRecord = {
  id: string;
  eventId: string;
  playerId: string;
  roomId: string;
  roomCode: string;
  clearedAt: string;
};

export type AnswerAttemptRecord = {
  id: string;
  eventId: string;
  playerId: string;
  roomId: string | null;
  inputRoomCode: string;
  normalizedRoomCode: string;
  inputAnswer: string;
  normalizedAnswer: string;
  result: AnswerResult;
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
  cleared?: boolean;
};

export type ClearedRoomItem = {
  roomCode: string;
  clearedAt: string;
};

export type RoomScore = {
  roomCode: string;
  ownerCount: number;
  score: number;
};

export type RankingRow = {
  playerId: string;
  nickname: string;
  score: number;
  clearedRoomCount: number;
  lastClearedAt: string | null;
  clearedRooms: string[];
};

export type RankingResponse = {
  totalPlayers: number;
  roomScores: RoomScore[];
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
  clearedRooms: ClearedRoomItem[];
  ranking: RankingResponse | null;
};

export type AdminEventControlResponse = {
  event: PublicEvent;
  message: string;
};

export type AdminDashboardResponse = {
  event: PublicEvent;
  totalPlayers: number;
  totalClears: number;
  players: RankingRow[];
};

export type AdminRoomsResponse = {
  rooms: AdminRoomRecord[];
  message?: string;
};

export type ExploreResponse = {
  resultType: ExploreResultType;
  message: string;
  alreadyExplored: boolean;
  room: null | {
    roomCode: string;
    title: string | null;
    puzzleText?: string | null;
    puzzleImageUrl?: string | null;
    displayMode: "hidden" | "visible";
  };
  card: ExploredRoomCard | null;
};

export type AnswerResponse = {
  result: AnswerResult;
  message: string;
  clearedRoom?: {
    roomCode: string;
    clearedAt: string;
  };
};
