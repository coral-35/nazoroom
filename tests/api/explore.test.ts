import { describe, expect, it } from "vitest";
import { createMemoryRepository, createSeedMemoryState } from "@/lib/server/memoryRepository";
import { createNazoroomService } from "@/lib/server/service";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

const now = new Date("2026-07-09T10:00:00.000Z");

describe("explore service", () => {
  it("returns not_found for unknown room codes", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");

    const result = await service.explore(DEFAULT_EVENT_ID, joined.player.id, "999");

    expect(result.resultType).toBe("not_found");
    expect(result.room).toBeNull();
    expect(result.card).toBeNull();
    expect(result.message).toContain("見つからなかった");

    const state = await service.getState(DEFAULT_EVENT_ID, joined.player.id);
    expect(state.explorationLogs).toHaveLength(0);
  });

  it("returns hidden clue without puzzle body", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");

    const result = await service.explore(DEFAULT_EVENT_ID, joined.player.id, "204");

    expect(result.resultType).toBe("hidden_clue");
    expect(result.message).toBe("部屋 204 を探索しました。");
    expect(result.room).toEqual({
      roomCode: "204",
      title: "現地探索型の謎",
      displayMode: "hidden"
    });
    expect(result.card?.puzzleText).toBeUndefined();
  });

  it("detects an already explored room without duplicating its log", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "テスト太郎");

    const first = await service.explore(DEFAULT_EVENT_ID, joined.player.id, "３０５");
    const second = await service.explore(DEFAULT_EVENT_ID, joined.player.id, "305");
    const state = await service.getState(DEFAULT_EVENT_ID, joined.player.id);

    expect(first.resultType).toBe("show_puzzle");
    expect(first.room?.puzzleText).toBe("時計の針が示す言葉を読め。");
    expect(first.alreadyExplored).toBe(false);
    expect(second.alreadyExplored).toBe(true);
    expect(second.message).toContain("探索済み");
    expect(state.explorationLogs).toHaveLength(1);
  });

  it("allows room exploration after results are published", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "終了後確認");
    await service.controlEvent(DEFAULT_EVENT_ID, "publish_results");

    const result = await service.explore(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "305"
    );

    expect(result.resultType).toBe("show_puzzle");
    expect(result.room?.roomCode).toBe("305");
  });
});

function makeService() {
  const repository = createMemoryRepository(createSeedMemoryState(now));
  return createNazoroomService(repository, { now: () => now });
}
