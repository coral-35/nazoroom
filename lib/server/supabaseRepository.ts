import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EventRecord,
  ExplorationLogRecord,
  PlayerRecord,
  PlayerTreasureRecord,
  RoomRecord,
  UnlockAttemptRecord
} from "@/lib/types/app";
import {
  buildExploredRoomCard,
  type CreateTreasureInput,
  type NazoroomRepository
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

    async createExplorationLog(input) {
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
        throw error;
      }

      return mapExplorationLog(data);
    },

    async listExplorationCards(eventId, playerId) {
      const [{ data: logData, error: logError }, { data: treasureData, error: treasureError }] =
        await Promise.all([
          client
            .from("exploration_logs")
            .select("*, rooms(*)")
            .eq("event_id", eventId)
            .eq("player_id", playerId)
            .order("created_at", { ascending: true }),
          client
            .from("player_treasures")
            .select("room_id")
            .eq("event_id", eventId)
            .eq("player_id", playerId)
        ]);

      if (logError) {
        throw logError;
      }
      if (treasureError) {
        throw treasureError;
      }

      const unlockedRoomIds = new Set(
        (treasureData ?? []).map((treasure) => treasure.room_id as string)
      );

      return (logData ?? []).map((row) => {
        const roomRow = normalizeJoinedRow(row.rooms);
        const room = roomRow ? mapRoom(roomRow) : null;
        const log = mapExplorationLog(row);

        return buildExploredRoomCard({
          log,
          room,
          unlocked: log.roomId ? unlockedRoomIds.has(log.roomId) : false
        });
      });
    },

    async listPlayerTreasures(eventId, playerId) {
      const { data, error } = await client
        .from("player_treasures")
        .select("*, rooms(room_code, treasure_description)")
        .eq("event_id", eventId)
        .eq("player_id", playerId)
        .order("unlocked_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapPlayerTreasure);
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

    async createUnlockAttempt(input) {
      const { data, error } = await client
        .from("unlock_attempts")
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

      return mapUnlockAttempt(data);
    },

    async getPlayerTreasure(eventId, playerId, roomId) {
      const { data, error } = await client
        .from("player_treasures")
        .select("*, rooms(room_code, treasure_description)")
        .eq("event_id", eventId)
        .eq("player_id", playerId)
        .eq("room_id", roomId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapPlayerTreasure(data) : null;
    },

    async createPlayerTreasureIdempotent(input: CreateTreasureInput) {
      const existing = await this.getPlayerTreasure(
        input.eventId,
        input.playerId,
        input.room.id
      );
      if (existing) {
        return { treasure: existing, created: false };
      }

      const { data, error } = await client
        .from("player_treasures")
        .insert({
          event_id: input.eventId,
          player_id: input.playerId,
          room_id: input.room.id,
          treasure_name: input.room.treasureName
        })
        .select("*, rooms(room_code, treasure_description)")
        .single();

      if (error) {
        if (error.code === "23505") {
          const treasure = await this.getPlayerTreasure(
            input.eventId,
            input.playerId,
            input.room.id
          );
          if (treasure) {
            return { treasure, created: false };
          }
        }
        throw error;
      }

      return { treasure: mapPlayerTreasure(data), created: true };
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

    async listAllTreasures(eventId) {
      const { data, error } = await client
        .from("player_treasures")
        .select("*, rooms(room_code, treasure_description)")
        .eq("event_id", eventId)
        .order("unlocked_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapPlayerTreasure);
    }
  };
}

function mapEvent(row: any): EventRecord {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
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
    treasureName: row.treasure_name,
    treasureDescription: row.treasure_description,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
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

function mapUnlockAttempt(row: any): UnlockAttemptRecord {
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

function mapPlayerTreasure(row: any): PlayerTreasureRecord {
  const room = normalizeJoinedRow(row.rooms);
  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    roomId: row.room_id,
    roomCode: room?.room_code ?? row.room_code ?? "",
    treasureName: row.treasure_name,
    treasureDescription: room?.treasure_description ?? null,
    unlockedAt: row.unlocked_at
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
