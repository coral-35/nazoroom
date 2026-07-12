import { describe, expect, it } from "vitest";
import { calculateRanking } from "@/lib/domain/scoring";

describe("calculateRanking", () => {
  it("scores cleared rooms by rarity and ranks players", () => {
    const result = calculateRanking({
      players: [
        { id: "p1", nickname: "A" },
        { id: "p2", nickname: "B" },
        { id: "p3", nickname: "C" }
      ],
      rooms: [
        { id: "a", roomCode: "101", sortOrder: 1 },
        { id: "b", roomCode: "102", sortOrder: 2 },
        { id: "c", roomCode: "103", sortOrder: 3 }
      ],
      clearedRooms: [
        {
          playerId: "p1",
          roomId: "a",
          clearedAt: "2026-07-09T10:00:00.000Z"
        },
        {
          playerId: "p1",
          roomId: "b",
          clearedAt: "2026-07-09T10:01:00.000Z"
        },
        {
          playerId: "p2",
          roomId: "b",
          clearedAt: "2026-07-09T10:02:00.000Z"
        },
        {
          playerId: "p1",
          roomId: "c",
          clearedAt: "2026-07-09T10:03:00.000Z"
        },
        {
          playerId: "p2",
          roomId: "c",
          clearedAt: "2026-07-09T10:04:00.000Z"
        },
        {
          playerId: "p3",
          roomId: "c",
          clearedAt: "2026-07-09T10:05:00.000Z"
        }
      ]
    });

    expect(result.roomScores).toEqual([
      { roomCode: "101", ownerCount: 1, score: 2 },
      { roomCode: "102", ownerCount: 2, score: 1 },
      { roomCode: "103", ownerCount: 3, score: 0 }
    ]);
    expect(result.ranking.map((row) => [row.nickname, row.score])).toEqual([
      ["A", 3],
      ["B", 1],
      ["C", 0]
    ]);
    expect(result.ranking[0]?.clearedRooms).toEqual(["101", "102", "103"]);
  });
});
