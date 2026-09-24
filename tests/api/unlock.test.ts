import { describe, expect, it } from "vitest";
import { createMemoryRepository, createSeedMemoryState } from "@/lib/server/memoryRepository";
import { createNazoroomService } from "@/lib/server/service";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

const activeNow = new Date("2026-07-09T10:00:00.000Z");

describe("answer service", () => {
  it("does not clear a room for an incorrect answer", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");

    const result = await service.answer(DEFAULT_EVENT_ID, joined.player.id, "305", "やみ");
    const state = await service.getState(DEFAULT_EVENT_ID, joined.player.id);

    expect(result.result).toBe("incorrect");
    expect(result.message).toContain("送信した解答: やみ");
    expect(state.clearedRooms).toHaveLength(0);
  });

  it("normalizes answers and clears the room on correct answers", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");

    const result = await service.answer(DEFAULT_EVENT_ID, joined.player.id, "305", " ヒカリ ");
    const state = await service.getState(DEFAULT_EVENT_ID, joined.player.id);

    expect(result.result).toBe("correct");
    expect(result.clearedRoom?.roomCode).toBe("305");
    expect(result.clearedRoom?.treasureName).toBe("宝A");
    expect(state.clearedRooms[0]?.treasureName).toBe("宝A");
    expect(state.clearedRooms).toHaveLength(1);
  });

  it("prevents duplicate room clears", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");

    await service.answer(DEFAULT_EVENT_ID, joined.player.id, "305", "ひかり");
    const second = await service.answer(DEFAULT_EVENT_ID, joined.player.id, "305", "ひかり");
    const state = await service.getState(DEFAULT_EVENT_ID, joined.player.id);

    expect(second.result).toBe("already_cleared");
    expect(second.clearedRoom?.treasureName).toBe("宝A");
    expect(state.clearedRooms).toHaveLength(1);
  });

  it("records attempts after the administrator closes exploration", async () => {
    const repository = createMemoryRepository(createSeedMemoryState(activeNow));
    const activeService = createNazoroomService(repository, { now: () => activeNow });
    const joined = await activeService.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");
    const expiredService = createNazoroomService(repository, { now: () => activeNow });
    await expiredService.controlEvent(DEFAULT_EVENT_ID, "close_exploration");

    const result = await expiredService.answer(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "305",
      "ひかり"
    );
    const state = await expiredService.getState(DEFAULT_EVENT_ID, joined.player.id);

    expect(result.result).toBe("expired");
    expect(state.clearedRooms).toHaveLength(0);
    expect(state.ranking).toBeNull();
  });

  it("calculates ranking from multiple players", async () => {
    const service = makeService();
    const playerA = await service.joinEvent(DEFAULT_EVENT_ID, "A");
    const playerB = await service.joinEvent(DEFAULT_EVENT_ID, "B");

    await service.answer(DEFAULT_EVENT_ID, playerA.player.id, "305", "ひかり");
    await service.answer(DEFAULT_EVENT_ID, playerA.player.id, "204", "ほし");
    await service.answer(DEFAULT_EVENT_ID, playerB.player.id, "204", "ほし");
    await service.controlEvent(DEFAULT_EVENT_ID, "publish_results");

    const ranking = await service.ranking(DEFAULT_EVENT_ID);

    expect(ranking.roomScores.find((score) => score.roomCode === "305")?.score).toBe(1);
    expect(ranking.roomScores.find((score) => score.roomCode === "204")?.score).toBe(0);
    expect(ranking.ranking[0]?.nickname).toBe("A");
  });
});

function makeService() {
  const repository = createMemoryRepository(createSeedMemoryState(activeNow));
  return createNazoroomService(repository, { now: () => activeNow });
}
