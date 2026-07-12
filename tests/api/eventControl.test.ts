import { describe, expect, it } from "vitest";
import { createMemoryRepository, createSeedMemoryState } from "@/lib/server/memoryRepository";
import { createNazoroomService } from "@/lib/server/service";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

const now = new Date("2026-07-09T10:00:00.000Z");

describe("event control service", () => {
  it("starts exploration with a local duration", async () => {
    const service = makeService();

    const result = await service.controlEvent(DEFAULT_EVENT_ID, "start_exploration", 30);

    expect(result.event.status).toBe("active");
    expect(result.event.startsAt).toBe("2026-07-09T10:00:00.000Z");
    expect(result.event.endsAt).toBeNull();
    expect(result.event.durationMinutes).toBe(30);
  });

  it("closes exploration before publishing results", async () => {
    const state = createSeedMemoryState(now);
    state.events[0] = {
      ...state.events[0],
      status: "draft",
      startsAt: null,
      endsAt: null
    };
    const repository = createMemoryRepository(state);
    const activeService = createNazoroomService(repository, { now: () => now });
    const joined = await activeService.joinEvent(DEFAULT_EVENT_ID, "A");
    await activeService.controlEvent(DEFAULT_EVENT_ID, "start_exploration", 60);
    await activeService.answer(DEFAULT_EVENT_ID, joined.player.id, "305", "ひかり");

    const closeTime = new Date("2026-07-09T10:15:00.000Z");
    const closeService = createNazoroomService(repository, { now: () => closeTime });
    const closed = await closeService.controlEvent(DEFAULT_EVENT_ID, "close_exploration");
    const stateBeforePublish = await closeService.getState(
      DEFAULT_EVENT_ID,
      joined.player.id
    );

    expect(closed.event.status).toBe("active");
    expect(closed.event.endsAt).toBe(closeTime.toISOString());
    expect(stateBeforePublish.ranking).toBeNull();
    await expect(closeService.ranking(DEFAULT_EVENT_ID)).rejects.toThrow(
      "結果はまだ発表されていません。"
    );

    const published = await closeService.controlEvent(
      DEFAULT_EVENT_ID,
      "publish_results"
    );
    const stateAfterPublish = await closeService.getState(
      DEFAULT_EVENT_ID,
      joined.player.id
    );

    expect(published.event.status).toBe("ended");
    expect(stateAfterPublish.ranking).not.toBeNull();
  });

  it("resets players and returns the event to draft", async () => {
    const service = makeService();
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "A");

    await service.answer(DEFAULT_EVENT_ID, joined.player.id, "305", "ひかり");
    const reset = await service.controlEvent(DEFAULT_EVENT_ID, "reset");

    expect(reset.event.status).toBe("draft");
    expect(reset.event.startsAt).toBeNull();
    expect(reset.event.endsAt).toBeNull();
    await expect(service.getState(DEFAULT_EVENT_ID, joined.player.id)).rejects.toThrow(
      "参加情報が確認できません。再参加してください。"
    );
  });

  it("summarizes participants and results for the admin dashboard", async () => {
    const service = makeService();
    const playerA = await service.joinEvent(DEFAULT_EVENT_ID, "A");
    await service.joinEvent(DEFAULT_EVENT_ID, "B");
    await service.controlEvent(DEFAULT_EVENT_ID, "start_exploration", 60);
    await service.answer(DEFAULT_EVENT_ID, playerA.player.id, "305", "ひかり");

    const dashboard = await service.getAdminDashboard(DEFAULT_EVENT_ID);

    expect(dashboard.totalPlayers).toBe(2);
    expect(dashboard.totalClears).toBe(1);
    expect(dashboard.players[0]).toMatchObject({
      nickname: "A",
      clearedRoomCount: 1
    });
  });
});

function makeService() {
  const state = createSeedMemoryState(now);
  state.events[0] = {
    ...state.events[0],
    status: "draft",
    startsAt: null,
    endsAt: null
  };
  const repository = createMemoryRepository(state);
  return createNazoroomService(repository, { now: () => now });
}
