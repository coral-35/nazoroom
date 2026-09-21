import { describe, expect, it } from "vitest";
import { sortExploredRoomCards } from "@/lib/domain/explorationCards";
import type { ExploredRoomCard } from "@/lib/types/app";

describe("sortExploredRoomCards", () => {
  it("prioritizes unsolved rooms and keeps found order within each group", () => {
    const cards: ExploredRoomCard[] = [
      makeCard("1", "305", "2026-07-09T10:00:00.000Z", true),
      makeCard("2", "204", "2026-07-09T10:03:00.000Z", false),
      makeCard("3", "A-01", "2026-07-09T10:01:00.000Z", false),
      makeCard("4", "101", "2026-07-09T10:02:00.000Z", true)
    ];

    expect(sortExploredRoomCards(cards).map((card) => card.roomCode)).toEqual([
      "A-01",
      "204",
      "305",
      "101"
    ]);
  });
});

function makeCard(
  logId: string,
  roomCode: string,
  createdAt: string,
  cleared: boolean
): ExploredRoomCard {
  return {
    logId,
    roomCode,
    resultType: "show_puzzle",
    message: `${roomCode} found`,
    createdAt,
    cleared
  };
}
