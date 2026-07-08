import { describe, expect, it } from "vitest";
import { createMemoryRepository, createSeedMemoryState } from "@/lib/server/memoryRepository";
import { createNazoroomService } from "@/lib/server/service";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

const activeNow = new Date("2026-07-09T10:00:00.000Z");

describe("unlock service", () => {
  it("does not grant treasure for incorrect answers", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");

    const result = await service.unlock(DEFAULT_EVENT_ID, joined.player.id, "305", "やみ");
    const state = await service.getState(DEFAULT_EVENT_ID, joined.player.id);

    expect(result.result).toBe("incorrect");
    expect(state.treasures).toHaveLength(0);
  });

  it("normalizes answers and grants treasure on correct answers", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");

    const result = await service.unlock(DEFAULT_EVENT_ID, joined.player.id, "305", " ヒカリ ");
    const state = await service.getState(DEFAULT_EVENT_ID, joined.player.id);

    expect(result.result).toBe("correct");
    expect(result.treasure?.name).toBe("月の鍵");
    expect(state.treasures).toHaveLength(1);
  });

  it("prevents duplicate treasure acquisition", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");

    await service.unlock(DEFAULT_EVENT_ID, joined.player.id, "305", "ひかり");
    const second = await service.unlock(DEFAULT_EVENT_ID, joined.player.id, "305", "ひかり");
    const state = await service.getState(DEFAULT_EVENT_ID, joined.player.id);

    expect(second.result).toBe("already_unlocked");
    expect(state.treasures).toHaveLength(1);
  });

  it("records expired unlock attempts without granting treasure", async () => {
    const repository = createMemoryRepository(createSeedMemoryState(activeNow));
    const activeService = createNazoroomService(repository, { now: () => activeNow });
    const joined = await activeService.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");
    const expiredService = createNazoroomService(repository, {
      now: () => new Date("2026-07-09T11:10:00.000Z")
    });

    const result = await expiredService.unlock(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "305",
      "ひかり"
    );
    const state = await expiredService.getState(DEFAULT_EVENT_ID, joined.player.id);

    expect(result.result).toBe("expired");
    expect(state.treasures).toHaveLength(0);
    expect(state.ranking).not.toBeNull();
  });

  it("calculates ranking from multiple players", async () => {
    const service = makeService();
    const playerA = await service.joinEvent(DEFAULT_EVENT_ID, "A");
    const playerB = await service.joinEvent(DEFAULT_EVENT_ID, "B");

    await service.unlock(DEFAULT_EVENT_ID, playerA.player.id, "305", "ひかり");
    await service.unlock(DEFAULT_EVENT_ID, playerA.player.id, "204", "ほし");
    await service.unlock(DEFAULT_EVENT_ID, playerB.player.id, "204", "ほし");

    const ranking = await service.ranking(DEFAULT_EVENT_ID);

    expect(ranking.treasureScores.find((score) => score.roomCode === "305")?.score).toBe(1);
    expect(ranking.treasureScores.find((score) => score.roomCode === "204")?.score).toBe(0);
    expect(ranking.ranking[0]?.nickname).toBe("A");
  });
});

function makeService() {
  const repository = createMemoryRepository(createSeedMemoryState(activeNow));
  return createNazoroomService(repository, { now: () => activeNow });
}
