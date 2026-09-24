import { treasureNameForOrder } from "@/lib/domain/treasures";
import { canExploreRooms, isEventActive, isEventExpired } from "@/lib/domain/eventStatus";
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
  AdminAssignmentInput,
  AdminProblemInput,
  AdminRoomsResponse,
  EventControlAction,
  EventRecord,
  ExploreResponse,
  JoinResponse,
  RankingResponse,
  RoomRecord,
  StateResponse,
  AnswerResponse
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
    async getCurrentEvent(): Promise<EventRecord> {
      return repository.getCurrentEvent();
    },

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
        totalClears: ranking.ranking.reduce(
          (total, player) => total + player.clearedRoomCount,
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
          nextEvent = await repository.createNextEvent({
            sourceEventId: eventId,
            title: event.title,
            durationMinutes: event.durationMinutes
          });
          message = "前回の参加者と探索履歴を残したまま、新しいイベントを作成しました。";
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
        rooms: await repository.listAdminRooms(eventId),
        problems: await repository.listProblemBank()
      };
    },

    async saveAdminRoom(
      eventId: string,
      rawRoom: unknown
    ): Promise<AdminRoomsResponse> {
      await getExistingEvent(repository, eventId);
      const input = parseAdminRoomInput(rawRoom);
      const [rooms, problems] = await Promise.all([
        repository.listAdminRooms(eventId),
        repository.listProblemBank()
      ]);
      const selectedProblem = input.problemId
        ? problems.find((problem) => problem.id === input.problemId)
        : null;
      if (input.problemId && !selectedProblem) {
        throw new AppError("問題を選択し直してください。", 400);
      }
      const roomInput = selectedProblem
        ? {
            ...input,
            roomCode: selectedProblem.roomCode,
            normalizedRoomCode: selectedProblem.normalizedRoomCode,
            puzzleImageUrl: selectedProblem.puzzleImageUrl,
            isActive: selectedProblem.isReserve ? false : input.isActive
          }
        : input;
      const duplicate = rooms.find(
        (room) =>
          room.normalizedRoomCode === roomInput.normalizedRoomCode &&
          room.id !== roomInput.roomId
      );

      if (duplicate) {
        throw new AppError("同じ部屋番号の問題がすでに登録されています。", 409);
      }

      const saved = await repository.upsertRoom({
        eventId,
        ...roomInput
      });

      return {
        rooms: await repository.listAdminRooms(eventId),
        problems,
        message: `部屋 ${saved.roomCode} の問題を保存しました。`
      };
    },

    async saveAdminProblem(
      eventId: string,
      rawProblem: unknown
    ): Promise<AdminRoomsResponse> {
      await getExistingEvent(repository, eventId);
      const problem = await repository.upsertProblem(parseAdminProblemInput(rawProblem));

      return {
        rooms: await repository.listAdminRooms(eventId),
        problems: await repository.listProblemBank(),
        message: `部屋 ${problem.roomCode} の問題登録を保存しました。`
      };
    },

    async saveAdminAssignments(
      eventId: string,
      rawAssignments: unknown
    ): Promise<AdminRoomsResponse> {
      await getExistingEvent(repository, eventId);
      const problems = await repository.listProblemBank();
      const problemIds = new Set(problems.map((problem) => problem.id));
      const assignments = parseAdminAssignments(rawAssignments);

      for (const assignment of assignments) {
        if (!problemIds.has(assignment.problemId)) {
          throw new AppError("問題を選択し直してください。", 400);
        }
      }

      return {
        rooms: await repository.saveAssignments(eventId, assignments),
        problems: await repository.listProblemBank(),
        message: "表示順と採用状態を保存しました。"
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

      const [explorationLogs, clearedRooms, ranking, rooms] = await Promise.all([
        repository.listExplorationCards(eventId, playerId),
        repository.listPlayerClears(eventId, playerId),
        event.status === "ended" ? calculateEventRanking(repository, eventId) : null,
        repository.listRooms(eventId)
      ]);

      return {
        event: publicEvent(event, now()),
        player: {
          id: player.id,
          nickname: player.nickname
        },
        explorationLogs,
        clearedRooms: clearedRooms.map((clearedRoom) => ({
          roomCode: clearedRoom.roomCode,
          treasureName: treasureNameForOrder(rooms.find((room) => room.id === clearedRoom.roomId)?.sortOrder),
          clearedAt: clearedRoom.clearedAt
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
      if (!canExploreRooms(event, now())) {
        throw new AppError(exploreNotAvailableMessage(event, now()), 409);
      }

      const room = await repository.getRoomByNormalizedCode(eventId, normalizedRoomCode);
      const message = buildExploreMessage(inputRoomCode, room);
      if (!room) {
        return {
          resultType: "not_found",
          message,
          alreadyExplored: false,
          room: null,
          card: null
        };
      }

      const { log, created } = await repository.createExplorationLogIdempotent({
        eventId,
        playerId,
        roomId: room.id,
        inputRoomCode,
        normalizedRoomCode,
        resultType: "show_puzzle",
        message
      });

      const cleared = Boolean(await repository.getPlayerClear(eventId, playerId, room.id));
      const card = buildExploredRoomCard({ log, room, cleared });

      return {
        resultType: card.resultType,
        message: created ? message : `部屋 ${room.roomCode} は探索済みです。`,
        alreadyExplored: !created,
        room: publicRoomForExplore(room),
        card
      };
    },

    async answer(
      eventId: string,
      playerId: string,
      rawRoomCode: unknown,
      rawAnswer: unknown
    ): Promise<AnswerResponse> {
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
        await repository.createAnswerAttempt({
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
        await repository.createAnswerAttempt({
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

      const existingClear = await repository.getPlayerClear(
        eventId,
        playerId,
        room.id
      );
      if (existingClear) {
        await repository.createAnswerAttempt({
          eventId,
          playerId,
          roomId: room.id,
          inputRoomCode,
          normalizedRoomCode,
          inputAnswer,
          normalizedAnswer,
          result: "already_cleared"
        });
        return {
          result: "already_cleared",
          message: "この部屋はすでにクリアしています。",
          clearedRoom: {
            treasureName: treasureNameForOrder(room.sortOrder),
            roomCode: existingClear.roomCode,
            clearedAt: existingClear.clearedAt
          }
        };
      }

      const answers = await repository.listRoomAnswers(room.id);
      const isCorrect = answers.some(
        (answer) => answer.normalizedAnswer === normalizedAnswer
      );

      if (!isCorrect) {
        await repository.createAnswerAttempt({
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
          message: `不正解です。送信した解答: ${inputAnswer}`
        };
      }

      const { clearedRoom, created } = await repository.createPlayerClearIdempotent({
        eventId,
        playerId,
        room
      });
      const result = created ? "correct" : "already_cleared";

      await repository.createAnswerAttempt({
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
          ? `正解。部屋 ${clearedRoom.roomCode} をクリアしました。`
          : "この部屋はすでにクリアしています。",
        clearedRoom: {
          treasureName: treasureNameForOrder(room.sortOrder),
          roomCode: clearedRoom.roomCode,
          clearedAt: clearedRoom.clearedAt
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
  const [players, rooms, clearedRooms] = await Promise.all([
    repository.listPlayers(eventId),
    repository.listRooms(eventId),
    repository.listAllClears(eventId)
  ]);

  return calculateRanking({ players, rooms, clearedRooms });
}

function publicEvent(event: EventRecord, serverNow: Date) {
  return {
    ...event,
    serverNow: serverNow.toISOString()
  };
}

function publicRoomForExplore(room: RoomRecord): ExploreResponse["room"] {
  return {
    roomCode: room.roomCode,
    puzzleImageUrl: room.puzzleImageUrl
  };
}

function buildExploreMessage(inputRoomCode: string, room: RoomRecord | null) {
  if (!room) {
    return `部屋 ${inputRoomCode} を探索した。しかし、この番号に対応する部屋は見つからなかった。`;
  }

  return `部屋 ${room.roomCode} を探索しました。`;
}

function eventNotActiveMessage(event: EventRecord, at: Date) {
  if (isEventExpired(event, at)) {
    return "制限時間が終了したため、解答できません。";
  }

  return "イベントはまだ開始されていません。";
}

function exploreNotAvailableMessage(event: EventRecord, at: Date) {
  if (isEventExpired(event, at)) {
    return "探索は終了しています。結果発表までお待ちください。";
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

  return {
    roomId: parseOptionalText(input.id, 80) ?? undefined,
    problemId: parseOptionalText(input.problemId, 80),
    roomCode,
    normalizedRoomCode: normalizeRoomCode(roomCode),
    puzzleImageUrl: parseOptionalText(input.puzzleImageUrl, 500),
    sortOrder: parseSortOrder(input.sortOrder),
    isActive: input.isActive !== false,
    answers: parseAdminAnswers(input.answers)
  };
}

function parseAdminProblemInput(rawProblem: unknown): AdminProblemInput {
  if (!rawProblem || typeof rawProblem !== "object" || Array.isArray(rawProblem)) {
    throw new AppError("問題の入力内容を確認してください。", 400);
  }

  const input = rawProblem as Record<string, unknown>;
  const id = parseRequiredText(input.id, 80);
  const roomCode = parseRoomCode(input.roomCode);
  const puzzleImageUrl = parseRequiredText(input.puzzleImageUrl, 500);

  return {
    id,
    roomCode,
    puzzleImageUrl,
    answers: parseAdminAnswers(input.answers).map((answer) => answer.answerText)
  };
}

function parseAdminAssignments(rawAssignments: unknown): AdminAssignmentInput[] {
  if (!Array.isArray(rawAssignments)) {
    throw new AppError("表示順の入力内容を確認してください。", 400);
  }

  const activeAssignments: AdminAssignmentInput[] = [];
  const inactiveAssignments: AdminAssignmentInput[] = [];
  const seen = new Set<string>();

  for (const rawAssignment of rawAssignments) {
    if (!rawAssignment || typeof rawAssignment !== "object" || Array.isArray(rawAssignment)) {
      throw new AppError("表示順の入力内容を確認してください。", 400);
    }

    const input = rawAssignment as Record<string, unknown>;
    const problemId = parseRequiredText(input.problemId, 80);
    if (seen.has(problemId)) {
      throw new AppError("同じ問題が複数回含まれています。", 400);
    }
    seen.add(problemId);

    const assignment = {
      problemId,
      roomId: parseOptionalText(input.roomId, 80) ?? undefined,
      isActive: input.isActive === true
    };

    if (assignment.isActive) {
      activeAssignments.push(assignment);
    } else {
      inactiveAssignments.push(assignment);
    }
  }

  if (activeAssignments.length > 26) {
    throw new AppError("有効な問題は26件以内にしてください。", 400);
  }

  return [...activeAssignments, ...inactiveAssignments];
}

function parseRequiredText(input: unknown, maxLength: number) {
  const value = parseOptionalText(input, maxLength);
  if (!value) {
    throw new AppError("入力内容を確認してください。", 400);
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
