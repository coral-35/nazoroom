import { isEventActive, isEventExpired } from "@/lib/domain/eventStatus";
import { normalizeAnswer, normalizeRoomCode } from "@/lib/domain/normalize";
import { calculateRanking } from "@/lib/domain/scoring";
import { AppError } from "@/lib/server/errors";
import type { NazoroomRepository } from "@/lib/server/repository";
import { buildExploredRoomCard } from "@/lib/server/repository";
import type { UpsertRoomInput } from "@/lib/server/repository";
import { createSupabaseRepository } from "@/lib/server/supabaseRepository";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  AdminEventControlResponse,
  AdminDashboardResponse,
  AdminRoomsResponse,
  EventControlAction,
  EventRecord,
  ExploreType,
  ExploreResponse,
  JoinResponse,
  RankingResponse,
  RoomRecord,
  StateResponse,
  UnlockResponse
} from "@/lib/types/app";
import { parseAnswer, parseNickname, parseRoomCode } from "@/lib/validations/schemas";

type ServiceOptions = {
  now?: () => Date;
};

let repositorySingleton: NazoroomRepository | null = null;

export function getNazoroomService() {
  repositorySingleton ??= createSupabaseRepository(createSupabaseAdminClient());

  return createNazoroomService(repositorySingleton);
}

export function createNazoroomService(
  repository: NazoroomRepository,
  options: ServiceOptions = {}
) {
  const now = options.now ?? (() => new Date());

  return {
    async getAdminEvent(eventId: string): Promise<AdminEventControlResponse> {
      const event = await getExistingEvent(repository, eventId);
      return {
        event: publicEvent(event, now()),
        message: adminEventSummary(event, now())
      };
    },

    async getAdminDashboard(eventId: string): Promise<AdminDashboardResponse> {
      const event = await getExistingEvent(repository, eventId);
      const ranking = await calculateEventRanking(repository, eventId);

      return {
        event: publicEvent(event, now()),
        totalPlayers: ranking.totalPlayers,
        totalUnlocks: ranking.ranking.reduce(
          (total, player) => total + player.treasureCount,
          0
        ),
        players: ranking.ranking
      };
    },

    async controlEvent(
      eventId: string,
      action: EventControlAction,
      rawDurationMinutes?: unknown
    ): Promise<AdminEventControlResponse> {
      const event = await getExistingEvent(repository, eventId);
      const controlledAt = now();
      let nextEvent: EventRecord;
      let message: string;

      switch (action) {
        case "start_exploration": {
          const durationMinutes = parseDurationMinutes(rawDurationMinutes);
          nextEvent = await repository.updateEvent({
            eventId,
            status: "active",
            startsAt: controlledAt.toISOString(),
            endsAt: null,
            durationMinutes
          });
          message = `探索を開始しました。制限時間は${durationMinutes}分です。`;
          break;
        }
        case "close_exploration":
          nextEvent = await repository.updateEvent({
            eventId,
            status: "active",
            startsAt: event.startsAt ?? controlledAt.toISOString(),
            endsAt: controlledAt.toISOString(),
            durationMinutes: event.durationMinutes
          });
          message = "探索を終了しました。結果発表はまだ公開していません。";
          break;
        case "publish_results":
          nextEvent = await repository.updateEvent({
            eventId,
            status: "ended",
            startsAt: event.startsAt ?? controlledAt.toISOString(),
            endsAt:
              event.endsAt && new Date(event.endsAt).getTime() <= controlledAt.getTime()
                ? event.endsAt
                : controlledAt.toISOString(),
            durationMinutes: event.durationMinutes
          });
          message = "結果を発表しました。ランキングを閲覧できます。";
          break;
        case "reset":
          nextEvent = await repository.resetEventProgress({
            eventId,
            status: "draft",
            startsAt: null,
            endsAt: null,
            durationMinutes: event.durationMinutes
          });
          message = "進行状況をリセットしました。参加者と探索履歴は消去されました。";
          break;
        default:
          throw new AppError("管理操作を選択してください。", 400);
      }

      return {
        event: publicEvent(nextEvent, controlledAt),
        message
      };
    },

    async listAdminRooms(eventId: string): Promise<AdminRoomsResponse> {
      await getExistingEvent(repository, eventId);

      return {
        rooms: await repository.listAdminRooms(eventId)
      };
    },

    async saveAdminRoom(
      eventId: string,
      rawRoom: unknown
    ): Promise<AdminRoomsResponse> {
      await getExistingEvent(repository, eventId);
      const input = parseAdminRoomInput(rawRoom);
      const rooms = await repository.listAdminRooms(eventId);
      const duplicate = rooms.find(
        (room) =>
          room.normalizedRoomCode === input.normalizedRoomCode &&
          room.id !== input.roomId
      );

      if (duplicate) {
        throw new AppError("同じ部屋番号の問題がすでに登録されています。", 409);
      }

      const saved = await repository.upsertRoom({
        eventId,
        ...input
      });

      return {
        rooms: await repository.listAdminRooms(eventId),
        message: `部屋 ${saved.roomCode} の問題を保存しました。`
      };
    },

    async joinEvent(eventId: string, rawNickname: unknown): Promise<JoinResponse> {
      const nickname = parseNickname(rawNickname);
      const event = await getExistingEvent(repository, eventId);

      if (event.status === "ended" || isEventExpired(event, now())) {
        throw new AppError("参加受付は終了しています。", 409);
      }

      const player = await repository.upsertPlayer(eventId, nickname);

      return {
        player: {
          id: player.id,
          nickname: player.nickname
        },
        event: publicEvent(event, now())
      };
    },

    async getState(eventId: string, playerId: string): Promise<StateResponse> {
      const [event, player] = await Promise.all([
        getExistingEvent(repository, eventId),
        repository.getPlayer(eventId, playerId)
      ]);

      if (!player) {
        throw new AppError("参加情報が確認できません。再参加してください。", 404);
      }

      const [explorationLogs, treasures, ranking] = await Promise.all([
        repository.listExplorationCards(eventId, playerId),
        repository.listPlayerTreasures(eventId, playerId),
        event.status === "ended" ? calculateEventRanking(repository, eventId) : null
      ]);

      return {
        event: publicEvent(event, now()),
        player: {
          id: player.id,
          nickname: player.nickname
        },
        explorationLogs,
        treasures: treasures.map((treasure) => ({
          roomCode: treasure.roomCode,
          name: treasure.treasureName,
          description: treasure.treasureDescription,
          unlockedAt: treasure.unlockedAt
        })),
        ranking
      };
    },

    async explore(
      eventId: string,
      playerId: string,
      rawRoomCode: unknown
    ): Promise<ExploreResponse> {
      const inputRoomCode = parseRoomCode(rawRoomCode);
      const normalizedRoomCode = normalizeRoomCode(inputRoomCode);
      const [event, player] = await Promise.all([
        getExistingEvent(repository, eventId),
        repository.getPlayer(eventId, playerId)
      ]);

      if (!player) {
        throw new AppError("参加情報が確認できません。再参加してください。", 404);
      }
      if (!isEventActive(event, now())) {
        throw new AppError(eventNotActiveMessage(event, now()), 409);
      }

      const room = await repository.getRoomByNormalizedCode(eventId, normalizedRoomCode);
      const message = buildExploreMessage(inputRoomCode, room);
      if (!room) {
        return {
          resultType: "not_found",
          message,
          room: null,
          card: null
        };
      }

      const log = await repository.createExplorationLog({
        eventId,
        playerId,
        roomId: room.id,
        inputRoomCode,
        normalizedRoomCode,
        resultType: room.exploreType,
        message
      });

      const unlocked = Boolean(await repository.getPlayerTreasure(eventId, playerId, room.id));
      const card = buildExploredRoomCard({ log, room, unlocked });

      return {
        resultType: card.resultType,
        message,
        room: publicRoomForExplore(room),
        card
      };
    },

    async unlock(
      eventId: string,
      playerId: string,
      rawRoomCode: unknown,
      rawAnswer: unknown
    ): Promise<UnlockResponse> {
      const inputRoomCode = parseRoomCode(rawRoomCode);
      const inputAnswer = parseAnswer(rawAnswer);
      const normalizedRoomCode = normalizeRoomCode(inputRoomCode);
      const normalizedAnswer = normalizeAnswer(inputAnswer);

      const [event, player, room] = await Promise.all([
        getExistingEvent(repository, eventId),
        repository.getPlayer(eventId, playerId),
        repository.getRoomByNormalizedCode(eventId, normalizedRoomCode)
      ]);

      if (!player) {
        throw new AppError("参加情報が確認できません。再参加してください。", 404);
      }

      if (!isEventActive(event, now())) {
        await repository.createUnlockAttempt({
          eventId,
          playerId,
          roomId: room?.id ?? null,
          inputRoomCode,
          normalizedRoomCode,
          inputAnswer,
          normalizedAnswer,
          result: "expired"
        });
        return {
          result: "expired",
          message: eventNotActiveMessage(event, now())
        };
      }

      if (!room) {
        await repository.createUnlockAttempt({
          eventId,
          playerId,
          roomId: null,
          inputRoomCode,
          normalizedRoomCode,
          inputAnswer,
          normalizedAnswer,
          result: "room_not_found"
        });
        return {
          result: "room_not_found",
          message: "この部屋番号に対応するロックは見つからなかった。"
        };
      }

      const existingTreasure = await repository.getPlayerTreasure(
        eventId,
        playerId,
        room.id
      );
      if (existingTreasure) {
        await repository.createUnlockAttempt({
          eventId,
          playerId,
          roomId: room.id,
          inputRoomCode,
          normalizedRoomCode,
          inputAnswer,
          normalizedAnswer,
          result: "already_unlocked"
        });
        return {
          result: "already_unlocked",
          message: "この部屋の宝はすでに入手済みです。",
          treasure: {
            roomCode: existingTreasure.roomCode,
            name: existingTreasure.treasureName,
            description: existingTreasure.treasureDescription,
            unlockedAt: existingTreasure.unlockedAt
          }
        };
      }

      const answers = await repository.listRoomAnswers(room.id);
      const isCorrect = answers.some(
        (answer) => answer.normalizedAnswer === normalizedAnswer
      );

      if (!isCorrect) {
        await repository.createUnlockAttempt({
          eventId,
          playerId,
          roomId: room.id,
          inputRoomCode,
          normalizedRoomCode,
          inputAnswer,
          normalizedAnswer,
          result: "incorrect"
        });
        return {
          result: "incorrect",
          message: "解錠に失敗した。答えが違うようだ。"
        };
      }

      const { treasure, created } = await repository.createPlayerTreasureIdempotent({
        eventId,
        playerId,
        room
      });
      const result = created ? "correct" : "already_unlocked";

      await repository.createUnlockAttempt({
        eventId,
        playerId,
        roomId: room.id,
        inputRoomCode,
        normalizedRoomCode,
        inputAnswer,
        normalizedAnswer,
        result
      });

      return {
        result,
        message: created
          ? `解錠成功。宝『${treasure.treasureName}』を入手した。`
          : "この部屋の宝はすでに入手済みです。",
        treasure: {
          roomCode: treasure.roomCode,
          name: treasure.treasureName,
          description: treasure.treasureDescription,
          unlockedAt: treasure.unlockedAt
        }
      };
    },

    async ranking(eventId: string): Promise<RankingResponse> {
      const event = await getExistingEvent(repository, eventId);
      if (event.status !== "ended") {
        throw new AppError("結果はまだ発表されていません。", 409);
      }

      return calculateEventRanking(repository, eventId);
    }
  };
}

async function getExistingEvent(repository: NazoroomRepository, eventId: string) {
  const event = await repository.getEvent(eventId);
  if (!event) {
    throw new AppError("イベントが見つかりません。", 404);
  }
  return event;
}

async function calculateEventRanking(
  repository: NazoroomRepository,
  eventId: string
): Promise<RankingResponse> {
  const [players, rooms, treasures] = await Promise.all([
    repository.listPlayers(eventId),
    repository.listRooms(eventId),
    repository.listAllTreasures(eventId)
  ]);

  return calculateRanking({ players, rooms, treasures });
}

function publicEvent(event: EventRecord, serverNow: Date) {
  return {
    ...event,
    serverNow: serverNow.toISOString()
  };
}

function publicRoomForExplore(room: RoomRecord): ExploreResponse["room"] {
  if (room.exploreType === "hidden_clue") {
    return {
      roomCode: room.roomCode,
      title: room.title,
      displayMode: "hidden"
    };
  }

  return {
    roomCode: room.roomCode,
    title: room.title,
    puzzleText: room.puzzleText,
    puzzleImageUrl: room.puzzleImageUrl,
    displayMode: "visible"
  };
}

function buildExploreMessage(inputRoomCode: string, room: RoomRecord | null) {
  if (!room) {
    return `部屋 ${inputRoomCode} を探索した。しかし、この番号に対応する部屋は見つからなかった。`;
  }

  if (room.exploreType === "hidden_clue") {
    return (
      room.hiddenMessage ??
      `部屋 ${room.roomCode} の扉に近づいた。画面上にはロックが表示されない。だが、周囲に何か違和感がある。`
    );
  }

  return `部屋 ${room.roomCode} のロックを発見した。`;
}

function eventNotActiveMessage(event: EventRecord, at: Date) {
  if (isEventExpired(event, at)) {
    return "制限時間が終了したため、解錠できない。";
  }

  return "イベントはまだ開始されていません。";
}

function parseDurationMinutes(rawDurationMinutes: unknown) {
  const value =
    typeof rawDurationMinutes === "number"
      ? rawDurationMinutes
      : typeof rawDurationMinutes === "string"
        ? Number(rawDurationMinutes)
        : 60;

  if (!Number.isInteger(value) || value < 1 || value > 1_440) {
    throw new AppError("制限時間は1分から1440分の範囲で指定してください。", 400);
  }

  return value;
}

function parseAdminRoomInput(
  rawRoom: unknown
): Omit<UpsertRoomInput, "eventId"> {
  if (!rawRoom || typeof rawRoom !== "object" || Array.isArray(rawRoom)) {
    throw new AppError("問題の入力内容を確認してください。", 400);
  }

  const input = rawRoom as Record<string, unknown>;
  const roomCode = parseRoomCode(input.roomCode);
  const exploreType = parseExploreType(input.exploreType);

  return {
    roomId: parseOptionalText(input.id, 80) ?? undefined,
    roomCode,
    normalizedRoomCode: normalizeRoomCode(roomCode),
    exploreType,
    title: parseOptionalText(input.title, 120),
    puzzleText: parseOptionalText(input.puzzleText, 2_000),
    puzzleImageUrl: parseOptionalText(input.puzzleImageUrl, 500),
    hiddenMessage: parseOptionalText(input.hiddenMessage, 1_000),
    treasureName: parseRequiredText(input.treasureName, "宝の名前", 120),
    treasureDescription: parseOptionalText(input.treasureDescription, 1_000),
    sortOrder: parseSortOrder(input.sortOrder),
    isActive: input.isActive !== false,
    answers: parseAdminAnswers(input.answers)
  };
}

function parseExploreType(input: unknown): ExploreType {
  if (input === "show_puzzle" || input === "hidden_clue") {
    return input;
  }

  throw new AppError("表示タイプを選択してください。", 400);
}

function parseRequiredText(input: unknown, label: string, maxLength: number) {
  if (typeof input !== "string") {
    throw new AppError(`${label}を入力してください。`, 400);
  }

  const value = input.trim();
  if (!value) {
    throw new AppError(`${label}を入力してください。`, 400);
  }
  if (value.length > maxLength) {
    throw new AppError(`${label}は${maxLength}文字以内で入力してください。`, 400);
  }

  return value;
}

function parseOptionalText(input: unknown, maxLength: number) {
  if (input === null || input === undefined) {
    return null;
  }
  if (typeof input !== "string") {
    throw new AppError("入力内容を確認してください。", 400);
  }

  const value = input.trim();
  if (!value) {
    return null;
  }
  if (value.length > maxLength) {
    throw new AppError(`${maxLength}文字以内で入力してください。`, 400);
  }

  return value;
}

function parseSortOrder(input: unknown) {
  const value =
    typeof input === "number"
      ? input
      : typeof input === "string"
        ? Number(input)
        : 0;

  if (!Number.isInteger(value) || value < 0 || value > 9_999) {
    throw new AppError("表示順は0から9999の整数で入力してください。", 400);
  }

  return value;
}

function parseAdminAnswers(input: unknown) {
  const rawAnswers =
    typeof input === "string"
      ? input.split(/\r?\n/)
      : Array.isArray(input)
        ? input
        : [];
  const answers: UpsertRoomInput["answers"] = [];
  const seen = new Set<string>();

  for (const rawAnswer of rawAnswers) {
    if (typeof rawAnswer !== "string") {
      throw new AppError("解答の入力内容を確認してください。", 400);
    }

    const answerText = rawAnswer.trim();
    if (!answerText) {
      continue;
    }
    if (answerText.length > 120) {
      throw new AppError("解答は120文字以内で入力してください。", 400);
    }

    const normalizedAnswer = normalizeAnswer(answerText);
    if (seen.has(normalizedAnswer)) {
      continue;
    }
    seen.add(normalizedAnswer);
    answers.push({
      answerText,
      normalizedAnswer
    });
  }

  if (answers.length === 0) {
    throw new AppError("解答を1つ以上入力してください。", 400);
  }
  if (answers.length > 20) {
    throw new AppError("解答は20個以内で入力してください。", 400);
  }

  return answers;
}

function adminEventSummary(event: EventRecord, at: Date) {
  if (event.status === "ended") {
    return "結果発表中です。";
  }
  if (isEventActive(event, at)) {
    return "探索中です。";
  }
  if (isEventExpired(event, at)) {
    return "探索は終了しています。結果発表はまだ公開していません。";
  }
  return "探索開始前です。";
}
