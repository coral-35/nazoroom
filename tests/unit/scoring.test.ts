import { describe, expect, it } from "vitest";
import { calculateRanking } from "@/lib/domain/scoring";

describe("calculateRanking", () => {
  it("scores treasures by rarity and ranks players", () => {
    const result = calculateRanking({
      players: [
        { id: "p1", nickname: "A" },
        { id: "p2", nickname: "B" },
        { id: "p3", nickname: "C" }
      ],
      rooms: [
        { id: "a", roomCode: "101", treasureName: "宝A", sortOrder: 1 },
        { id: "b", roomCode: "102", treasureName: "宝B", sortOrder: 2 },
        { id: "c", roomCode: "103", treasureName: "宝C", sortOrder: 3 }
      ],
      treasures: [
        {
          playerId: "p1",
          roomId: "a",
          treasureName: "宝A",
          unlockedAt: "2026-07-09T10:00:00.000Z"
        },
        {
          playerId: "p1",
          roomId: "b",
          treasureName: "宝B",
          unlockedAt: "2026-07-09T10:01:00.000Z"
        },
        {
          playerId: "p2",
          roomId: "b",
          treasureName: "宝B",
          unlockedAt: "2026-07-09T10:02:00.000Z"
        },
        {
          playerId: "p1",
          roomId: "c",
          treasureName: "宝C",
          unlockedAt: "2026-07-09T10:03:00.000Z"
        },
        {
          playerId: "p2",
          roomId: "c",
          treasureName: "宝C",
          unlockedAt: "2026-07-09T10:04:00.000Z"
        },
        {
          playerId: "p3",
          roomId: "c",
          treasureName: "宝C",
          unlockedAt: "2026-07-09T10:05:00.000Z"
        }
      ]
    });

    expect(result.treasureScores).toEqual([
      { roomCode: "101", treasureName: "宝A", ownerCount: 1, score: 2 },
      { roomCode: "102", treasureName: "宝B", ownerCount: 2, score: 1 },
      { roomCode: "103", treasureName: "宝C", ownerCount: 3, score: 0 }
    ]);
    expect(result.ranking.map((row) => [row.nickname, row.score])).toEqual([
      ["A", 3],
      ["B", 1],
      ["C", 0]
    ]);
  });
});
