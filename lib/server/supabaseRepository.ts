import type { SupabaseClient } from "@supabase/supabase-js";
import { sortExploredRoomCards } from "@/lib/domain/explorationCards";
import type {
  EventRecord,
  ExplorationLogRecord,
  PlayerRecord,
  PlayerClearRecord,
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

export function createSupabaseRepository(client: SupabaseClient): NazoroomRepository {
  return {
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

    async upsertRoom(input) {
      return upsertRoomRow(client, input);
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

async function upsertRoomRow(client: SupabaseClient, input: UpsertRoomInput) {
  const payload = {
    event_id: input.eventId,
    room_code: input.roomCode,
    normalized_room_code: input.normalizedRoomCode,
    explore_type: input.exploreType,
    title: input.title,
    puzzle_text: input.puzzleText,
    puzzle_image_url: input.puzzleImageUrl,
    hidden_message: input.hiddenMessage,
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
    roomCode: row.room_code,
    normalizedRoomCode: row.normalized_room_code,
    exploreType: row.explore_type,
    title: row.title,
    puzzleText: row.puzzle_text,
    puzzleImageUrl: row.puzzle_image_url,
    hiddenMessage: row.hidden_message,
    sortOrder: row.sort_order,
    isActive: row.is_active,
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
