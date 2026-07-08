import type {
  PlayerRecord,
  PlayerTreasureRecord,
  RankingResponse,
  RoomRecord
} from "@/lib/types/app";

export function calculateRanking(input: {
  players: Pick<PlayerRecord, "id" | "nickname">[];
  rooms: Pick<RoomRecord, "id" | "roomCode" | "treasureName" | "sortOrder">[];
  treasures: Pick<
    PlayerTreasureRecord,
    "playerId" | "roomId" | "treasureName" | "unlockedAt"
  >[];
}): RankingResponse {
  const uniqueTreasures = dedupeTreasures(input.treasures);
  const totalPlayers = input.players.length;
  const roomsById = new Map(input.rooms.map((room) => [room.id, room]));

  const ownersByRoom = new Map<string, Set<string>>();
  for (const treasure of uniqueTreasures) {
    const owners = ownersByRoom.get(treasure.roomId) ?? new Set<string>();
    owners.add(treasure.playerId);
    ownersByRoom.set(treasure.roomId, owners);
  }

  const treasureScores = input.rooms
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.roomCode.localeCompare(b.roomCode))
    .map((room) => {
      const ownerCount = ownersByRoom.get(room.id)?.size ?? 0;
      return {
        roomCode: room.roomCode,
        treasureName: room.treasureName,
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

  const treasuresByPlayer = new Map<
    string,
    Pick<PlayerTreasureRecord, "playerId" | "roomId" | "treasureName" | "unlockedAt">[]
  >();
  for (const treasure of uniqueTreasures) {
    const playerTreasures = treasuresByPlayer.get(treasure.playerId) ?? [];
    playerTreasures.push(treasure);
    treasuresByPlayer.set(treasure.playerId, playerTreasures);
  }

  const ranking = input.players
    .map((player) => {
      const treasures = treasuresByPlayer.get(player.id) ?? [];
      const score = treasures.reduce(
        (sum, treasure) => sum + (scoreByRoom.get(treasure.roomId) ?? 0),
        0
      );
      const lastUnlockedAt = treasures
        .map((treasure) => treasure.unlockedAt)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

      return {
        playerId: player.id,
        nickname: player.nickname,
        score,
        treasureCount: treasures.length,
        lastUnlockedAt,
        treasures: treasures
          .slice()
          .sort((a, b) => {
            const roomA = roomsById.get(a.roomId);
            const roomB = roomsById.get(b.roomId);
            return (roomA?.sortOrder ?? 0) - (roomB?.sortOrder ?? 0);
          })
          .map((treasure) => treasure.treasureName)
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.treasureCount !== a.treasureCount) {
        return b.treasureCount - a.treasureCount;
      }
      if (a.lastUnlockedAt && b.lastUnlockedAt) {
        const timeDiff =
          new Date(a.lastUnlockedAt).getTime() -
          new Date(b.lastUnlockedAt).getTime();
        if (timeDiff !== 0) {
          return timeDiff;
        }
      } else if (a.lastUnlockedAt || b.lastUnlockedAt) {
        return a.lastUnlockedAt ? -1 : 1;
      }

      return a.nickname.localeCompare(b.nickname, "ja");
    });

  return {
    totalPlayers,
    treasureScores,
    ranking
  };
}

function dedupeTreasures(
  treasures: Pick<
    PlayerTreasureRecord,
    "playerId" | "roomId" | "treasureName" | "unlockedAt"
  >[]
) {
  const seen = new Set<string>();
  return treasures.filter((treasure) => {
    const key = `${treasure.playerId}:${treasure.roomId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
