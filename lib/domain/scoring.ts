import type {
  PlayerRecord,
  PlayerClearRecord,
  RankingResponse,
  RoomRecord
} from "@/lib/types/app";

export function calculateRanking(input: {
  players: Pick<PlayerRecord, "id" | "nickname">[];
  rooms: Pick<RoomRecord, "id" | "roomCode" | "sortOrder">[];
  clearedRooms: Pick<
    PlayerClearRecord,
    "playerId" | "roomId" | "clearedAt"
  >[];
}): RankingResponse {
  const uniqueClears = dedupeClears(input.clearedRooms);
  const totalPlayers = input.players.length;
  const roomsById = new Map(input.rooms.map((room) => [room.id, room]));

  const ownersByRoom = new Map<string, Set<string>>();
  for (const clearedRoom of uniqueClears) {
    const owners = ownersByRoom.get(clearedRoom.roomId) ?? new Set<string>();
    owners.add(clearedRoom.playerId);
    ownersByRoom.set(clearedRoom.roomId, owners);
  }

  const roomScores = input.rooms
    .slice()
    .sort((a, b) => compareRoomCodes(a.roomCode, b.roomCode))
    .map((room) => {
      const ownerCount = ownersByRoom.get(room.id)?.size ?? 0;
      return {
        roomCode: room.roomCode,
        ownerCount,
        score: totalPlayers - ownerCount
      };
    });

  const scoreByRoom = new Map(
    input.rooms.map((room) => {
      const ownerCount = ownersByRoom.get(room.id)?.size ?? 0;
      return [room.id, totalPlayers - ownerCount];
    })
  );

  const clearsByPlayer = new Map<
    string,
    Pick<PlayerClearRecord, "playerId" | "roomId" | "clearedAt">[]
  >();
  for (const clearedRoom of uniqueClears) {
    const playerClears = clearsByPlayer.get(clearedRoom.playerId) ?? [];
    playerClears.push(clearedRoom);
    clearsByPlayer.set(clearedRoom.playerId, playerClears);
  }

  const ranking = input.players
    .map((player) => {
      const clearedRooms = clearsByPlayer.get(player.id) ?? [];
      const score = clearedRooms.reduce(
        (sum, clearedRoom) => sum + (scoreByRoom.get(clearedRoom.roomId) ?? 0),
        0
      );
      const lastClearedAt = clearedRooms
        .map((clearedRoom) => clearedRoom.clearedAt)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

      return {
        playerId: player.id,
        nickname: player.nickname,
        score,
        clearedRoomCount: clearedRooms.length,
        lastClearedAt,
        clearedRooms: clearedRooms
          .slice()
          .sort((a, b) =>
            compareRoomCodes(
              roomsById.get(a.roomId)?.roomCode ?? "",
              roomsById.get(b.roomId)?.roomCode ?? ""
            )
          )
          .map((clearedRoom) => roomsById.get(clearedRoom.roomId)?.roomCode ?? "")
          .filter(Boolean)
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.clearedRoomCount !== a.clearedRoomCount) {
        return b.clearedRoomCount - a.clearedRoomCount;
      }
      if (a.lastClearedAt && b.lastClearedAt) {
        const timeDiff =
          new Date(a.lastClearedAt).getTime() -
          new Date(b.lastClearedAt).getTime();
        if (timeDiff !== 0) {
          return timeDiff;
        }
      } else if (a.lastClearedAt || b.lastClearedAt) {
        return a.lastClearedAt ? -1 : 1;
      }

      return a.nickname.localeCompare(b.nickname, "ja");
    });

  return {
    totalPlayers,
    roomScores,
    ranking
  };
}

function compareRoomCodes(a: string, b: string) {
  return a.localeCompare(b, "ja", { numeric: true });
}

function dedupeClears(
  clearedRooms: Pick<
    PlayerClearRecord,
    "playerId" | "roomId" | "clearedAt"
  >[]
) {
  const seen = new Set<string>();
  return clearedRooms.filter((clearedRoom) => {
    const key = `${clearedRoom.playerId}:${clearedRoom.roomId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
