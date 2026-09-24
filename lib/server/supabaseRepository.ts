import type { SupabaseClient } from "@supabase/supabase-js";
import { sortExploredRoomCards } from "@/lib/domain/explorationCards";
import { normalizeAnswer, normalizeRoomCode } from "@/lib/domain/normalize";
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
  type CreateNextEventInput,
  type NazoroomRepository,
  type UpdateEventInput,
  type UpsertRoomInput
} from "@/lib/server/repository";

export function createSupabaseRepository(client: SupabaseClient): NazoroomRepository {
  return {
    async getCurrentEvent() {
      const { data, error } = await client
        .from("app_settings")
        .select("current_event_id, events(*)")
        .eq("id", "current")
        .single();

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST116") {
          return getFallbackCurrentEvent(client);
        }
        throw error;
      }

      const eventRow = Array.isArray(data.events) ? data.events[0] : data.events;
      if (!eventRow) {
        return getFallbackCurrentEvent(client);
      }
      return mapEvent(eventRow);
    },

    async getEvent(eventId) {
      const { data, error } = await client
        .from("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapEvent(data) : null;
    },

    async updateEvent(input) {
      return updateEventRow(client, input);
    },

    async createNextEvent(input) {
      return createNextEventRow(client, input);
    },

    async resetEventProgress(input) {
      const tables = [
        "answer_attempts",
        "player_cleared_rooms",
        "exploration_logs",
        "players"
      ];

      for (const table of tables) {
        const { error } = await client
          .from(table)
          .delete()
          .eq("event_id", input.eventId);

        if (error) {
          throw error;
        }
      }

      return updateEventRow(client, input);
    },

    async upsertPlayer(eventId, nickname) {
      const { data, error } = await client
        .from("players")
        .upsert(
          {
            event_id: eventId,
            nickname
          },
          { onConflict: "event_id,nickname" }
        )
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return mapPlayer(data);
    },

    async getPlayer(eventId, playerId) {
      const { data, error } = await client
        .from("players")
        .select("*")
        .eq("event_id", eventId)
        .eq("id", playerId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapPlayer(data) : null;
    },

    async getRoomByNormalizedCode(eventId, normalizedRoomCode) {
      const { data, error } = await client
        .from("rooms")
        .select("*")
        .eq("event_id", eventId)
        .eq("normalized_room_code", normalizedRoomCode)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapRoom(data) : null;
    },

    async createExplorationLogIdempotent(input) {
      const existing = await getExplorationLogByRoom(
        client,
        input.eventId,
        input.playerId,
        input.roomId
      );
      if (existing) {
        return { log: existing, created: false };
      }

      const { data, error } = await client
        .from("exploration_logs")
        .insert({
          event_id: input.eventId,
          player_id: input.playerId,
          room_id: input.roomId,
          input_room_code: input.inputRoomCode,
          normalized_room_code: input.normalizedRoomCode,
          result_type: input.resultType,
          message: input.message
        })
        .select("*")
        .single();

      if (error) {
        if (error.code === "23505") {
          const concurrent = await getExplorationLogByRoom(
            client,
            input.eventId,
            input.playerId,
            input.roomId
          );
          if (concurrent) {
            return { log: concurrent, created: false };
          }
        }
        throw error;
      }

      return { log: mapExplorationLog(data), created: true };
    },

    async listExplorationCards(eventId, playerId) {
      const [{ data: logData, error: logError }, { data: clearData, error: clearError }] =
        await Promise.all([
          client
            .from("exploration_logs")
            .select("*, rooms(*)")
            .eq("event_id", eventId)
            .eq("player_id", playerId)
            .order("created_at", { ascending: true }),
          client
            .from("player_cleared_rooms")
            .select("room_id")
            .eq("event_id", eventId)
            .eq("player_id", playerId)
        ]);

      if (logError) {
        throw logError;
      }
      if (clearError) {
        throw clearError;
      }

      const clearedRoomIds = new Set(
        (clearData ?? []).map((clear) => clear.room_id as string)
      );

      const cards = (logData ?? []).map((row) => {
        const roomRow = normalizeJoinedRow(row.rooms);
        const room = roomRow ? mapRoom(roomRow) : null;
        const log = mapExplorationLog(row);

        return buildExploredRoomCard({
          log,
          room,
          cleared: log.roomId ? clearedRoomIds.has(log.roomId) : false
        });
      });

      return sortExploredRoomCards(cards);
    },

    async listPlayerClears(eventId, playerId) {
      const { data, error } = await client
        .from("player_cleared_rooms")
        .select("*, rooms(room_code)")
        .eq("event_id", eventId)
        .eq("player_id", playerId)
        .order("cleared_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapPlayerClear);
    },

    async listRoomAnswers(roomId) {
      const { data, error } = await client
        .from("room_answers")
        .select("normalized_answer")
        .eq("room_id", roomId);

      if (error) {
        throw error;
      }

      return (data ?? []).map((row) => ({
        normalizedAnswer: row.normalized_answer as string
      }));
    },

    async createAnswerAttempt(input) {
      const { data, error } = await client
        .from("answer_attempts")
        .insert({
          event_id: input.eventId,
          player_id: input.playerId,
          room_id: input.roomId,
          input_room_code: input.inputRoomCode,
          normalized_room_code: input.normalizedRoomCode,
          input_answer: input.inputAnswer,
          normalized_answer: input.normalizedAnswer,
          result: input.result
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return mapAnswerAttempt(data);
    },

    async getPlayerClear(eventId, playerId, roomId) {
      const { data, error } = await client
        .from("player_cleared_rooms")
        .select("*, rooms(room_code)")
        .eq("event_id", eventId)
        .eq("player_id", playerId)
        .eq("room_id", roomId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapPlayerClear(data) : null;
    },

    async createPlayerClearIdempotent(input: CreateClearInput) {
      const existing = await this.getPlayerClear(
        input.eventId,
        input.playerId,
        input.room.id
      );
      if (existing) {
        return { clearedRoom: existing, created: false };
      }

      const { data, error } = await client
        .from("player_cleared_rooms")
        .insert({
          event_id: input.eventId,
          player_id: input.playerId,
          room_id: input.room.id
        })
        .select("*, rooms(room_code)")
        .single();

      if (error) {
        if (error.code === "23505") {
          const clearedRoom = await this.getPlayerClear(
            input.eventId,
            input.playerId,
            input.room.id
          );
          if (clearedRoom) {
            return { clearedRoom, created: false };
          }
        }
        throw error;
      }

      return { clearedRoom: mapPlayerClear(data), created: true };
    },

    async listPlayers(eventId) {
      const { data, error } = await client
        .from("players")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapPlayer);
    },

    async listRooms(eventId) {
      const { data, error } = await client
        .from("rooms")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapRoom);
    },

    async listAdminRooms(eventId) {
      const { data, error } = await client
        .from("rooms")
        .select("*, room_answers(*)")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true })
        .order("room_code", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapAdminRoom);
    },

    async listProblemBank() {
      const { data, error } = await client
        .from("problem_bank")
        .select("*")
        .order("problem_number", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapProblemBank);
    },

    async upsertProblem(input) {
      const normalizedRoomCode = normalizeRoomCode(input.roomCode);
      const { data, error } = await client
        .from("problem_bank")
        .update({
          room_code: input.roomCode,
          normalized_room_code: normalizedRoomCode,
          puzzle_image_url: input.puzzleImageUrl,
          default_answers: input.answers
        })
        .eq("id", input.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return mapProblemBank(data);
    },

    async upsertRoom(input) {
      return upsertRoomRow(client, input);
    },

    async saveAssignments(eventId, assignments) {
      const problems = await this.listProblemBank();
      const currentRooms = await this.listAdminRooms(eventId);
      let sortOrder = 1;
      const assignedProblemIds = new Set<string>();
      const usedRoomIds = new Set<string>();

      for (const assignment of assignments) {
        const problem = problems.find((item) => item.id === assignment.problemId);
        if (!problem) {
          continue;
        }
        assignedProblemIds.add(problem.id);

        const currentRoom =
          currentRooms.find(
            (room) => room.normalizedRoomCode === problem.normalizedRoomCode
          ) ??
          currentRooms.find((room) => room.problemId === problem.id) ??
          currentRooms.find((room) => room.id === assignment.roomId) ??
          null;
        const isActive = assignment.isActive;
        if (currentRoom) {
          usedRoomIds.add(currentRoom.id);
        }

        await upsertRoomRow(client, {
          eventId,
          roomId: currentRoom?.id,
          problemId: problem.id,
          roomCode: problem.roomCode,
          normalizedRoomCode: problem.normalizedRoomCode,
          puzzleImageUrl: problem.puzzleImageUrl,
          sortOrder: isActive ? sortOrder++ : 0,
          isActive,
          answers: problem.defaultAnswers.map((answer) => ({
            answerText: answer,
            normalizedAnswer: normalizeAnswer(answer)
          }))
        });
      }

      for (const room of currentRooms) {
        if (!room.id || usedRoomIds.has(room.id) || !assignedProblemIds.has(room.problemId ?? "")) {
          continue;
        }

        await upsertRoomRow(client, {
          eventId,
          roomId: room.id,
          problemId: null,
          roomCode: room.roomCode,
          normalizedRoomCode: room.normalizedRoomCode,
          puzzleImageUrl: room.puzzleImageUrl,
          sortOrder: 0,
          isActive: false,
          answers: room.answers.map((answer) => ({
            answerText: answer.answerText,
            normalizedAnswer: answer.normalizedAnswer
          }))
        });
      }

      return this.listAdminRooms(eventId);
    },

    async listAllClears(eventId) {
      const { data, error } = await client
        .from("player_cleared_rooms")
        .select("*, rooms(room_code)")
        .eq("event_id", eventId)
        .order("cleared_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapPlayerClear);
    }
  };
}

async function getExplorationLogByRoom(
  client: SupabaseClient,
  eventId: string,
  playerId: string,
  roomId: string | null
) {
  if (!roomId) {
    return null;
  }

  const { data, error } = await client
    .from("exploration_logs")
    .select("*")
    .eq("event_id", eventId)
    .eq("player_id", playerId)
    .eq("room_id", roomId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapExplorationLog(data) : null;
}

async function updateEventRow(client: SupabaseClient, input: UpdateEventInput) {
  const { data, error } = await client
    .from("events")
    .update({
      status: input.status,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      duration_minutes: input.durationMinutes
    })
    .eq("id", input.eventId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapEvent(data);
}

async function getFallbackCurrentEvent(client: SupabaseClient) {
  const { data, error } = await client
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw error;
  }

  return mapEvent(data);
}

async function createNextEventRow(client: SupabaseClient, input: CreateNextEventInput) {
  const { data: eventData, error: eventError } = await client
    .from("events")
    .insert({
      title: input.title,
      status: "draft",
      starts_at: null,
      ends_at: null,
      duration_minutes: input.durationMinutes
    })
    .select("*")
    .single();

  if (eventError) {
    throw eventError;
  }

  const nextEvent = mapEvent(eventData);
  const sourceRooms = await listAdminRoomRows(client, input.sourceEventId);

  for (const sourceRoom of sourceRooms) {
    await upsertRoomRow(client, {
      eventId: nextEvent.id,
      problemId: sourceRoom.problemId,
      roomCode: sourceRoom.roomCode,
      normalizedRoomCode: sourceRoom.normalizedRoomCode,
      puzzleImageUrl: sourceRoom.puzzleImageUrl,
      sortOrder: sourceRoom.sortOrder,
      isActive: sourceRoom.isActive,
      answers: sourceRoom.answers.map((answer) => ({
        answerText: answer.answerText,
        normalizedAnswer: answer.normalizedAnswer
      }))
    });
  }

  const { error: settingError } = await client
    .from("app_settings")
    .upsert({ id: "current", current_event_id: nextEvent.id }, { onConflict: "id" });

  if (settingError) {
    throw settingError;
  }

  return nextEvent;
}

async function listAdminRoomRows(client: SupabaseClient, eventId: string) {
  const { data, error } = await client
    .from("rooms")
    .select("*, room_answers(*)")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("room_code", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapAdminRoom);
}

async function upsertRoomRow(client: SupabaseClient, input: UpsertRoomInput) {
  const payload = {
    event_id: input.eventId,
    problem_id: input.problemId,
    room_code: input.roomCode,
    normalized_room_code: input.normalizedRoomCode,
    explore_type: "show_puzzle",
    title: null,
    puzzle_text: null,
    puzzle_image_url: input.puzzleImageUrl,
    hidden_message: null,
    sort_order: input.sortOrder,
    is_active: input.isActive
  };

  const query = input.roomId
    ? client
        .from("rooms")
        .update(payload)
        .eq("id", input.roomId)
        .eq("event_id", input.eventId)
    : client.from("rooms").insert(payload);

  const { data: roomData, error: roomError } = await query.select("*").single();

  if (roomError) {
    throw roomError;
  }

  const room = mapRoom(roomData);
  const { error: deleteError } = await client
    .from("room_answers")
    .delete()
    .eq("room_id", room.id);

  if (deleteError) {
    throw deleteError;
  }

  if (input.answers.length > 0) {
    const { error: insertError } = await client.from("room_answers").insert(
      input.answers.map((answer) => ({
        room_id: room.id,
        answer_text: answer.answerText,
        normalized_answer: answer.normalizedAnswer
      }))
    );

    if (insertError) {
      throw insertError;
    }
  }

  return getAdminRoomById(client, room.id);
}

async function getAdminRoomById(client: SupabaseClient, roomId: string) {
  const { data, error } = await client
    .from("rooms")
    .select("*, room_answers(*)")
    .eq("id", roomId)
    .single();

  if (error) {
    throw error;
  }

  return mapAdminRoom(data);
}

function mapEvent(row: any): EventRecord {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes ?? 60,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPlayer(row: any): PlayerRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    nickname: row.nickname,
    createdAt: row.created_at
  };
}

function mapRoom(row: any): RoomRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    problemId: row.problem_id ?? null,
    roomCode: row.room_code,
    normalizedRoomCode: row.normalized_room_code,
    puzzleImageUrl: row.puzzle_image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapProblemBank(row: any): ProblemBankRecord {
  return {
    id: row.id,
    problemNumber: row.problem_number,
    roomCode: row.room_code,
    normalizedRoomCode: row.normalized_room_code,
    puzzleImageUrl: row.puzzle_image_url,
    defaultAnswers: Array.isArray(row.default_answers) ? row.default_answers : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAdminRoom(row: any) {
  const room = mapRoom(row);
  const answers = normalizeJoinedRows(row.room_answers).map(mapRoomAnswer);

  return {
    ...room,
    answers: answers.sort((a, b) => a.answerText.localeCompare(b.answerText))
  };
}

function mapRoomAnswer(row: any): RoomAnswerRecord {
  return {
    id: row.id,
    roomId: row.room_id,
    answerText: row.answer_text,
    normalizedAnswer: row.normalized_answer,
    createdAt: row.created_at
  };
}

function mapExplorationLog(row: any): ExplorationLogRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    roomId: row.room_id,
    inputRoomCode: row.input_room_code,
    normalizedRoomCode: row.normalized_room_code,
    resultType: row.result_type,
    message: row.message,
    createdAt: row.created_at
  };
}

function mapAnswerAttempt(row: any): AnswerAttemptRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    roomId: row.room_id,
    inputRoomCode: row.input_room_code,
    normalizedRoomCode: row.normalized_room_code,
    inputAnswer: row.input_answer,
    normalizedAnswer: row.normalized_answer,
    result: row.result,
    createdAt: row.created_at
  };
}

function mapPlayerClear(row: any): PlayerClearRecord {
  const room = normalizeJoinedRow(row.rooms);
  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    roomId: row.room_id,
    roomCode: room?.room_code ?? row.room_code ?? "",
    clearedAt: row.cleared_at
  };
}

function normalizeJoinedRow(row: any): any | null {
  if (!row) {
    return null;
  }
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }
  return row;
}

function normalizeJoinedRows(row: any): any[] {
  if (!row) {
    return [];
  }
  return Array.isArray(row) ? row : [row];
}
