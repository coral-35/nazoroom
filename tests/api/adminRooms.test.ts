import { describe, expect, it } from "vitest";
import { createMemoryRepository, createSeedMemoryState } from "@/lib/server/memoryRepository";
import { createNazoroomService } from "@/lib/server/service";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

const now = new Date("2026-07-09T10:00:00.000Z");

describe("admin room service", () => {
  it("updates room content and answer checks", async () => {
    const service = makeService();
    const initial = await service.listAdminRooms(DEFAULT_EVENT_ID);
    const room = initial.rooms.find((item) => item.roomCode === "305");
    expect(room).toBeTruthy();

    await service.saveAdminRoom(DEFAULT_EVENT_ID, {
      id: room?.id,
      roomCode: "305",
      exploreType: "show_puzzle",
      title: "更新された時計の暗号",
      puzzleText: "新しい針の向きを読め。",
      puzzleImageUrl: "",
      hiddenMessage: "",
      treasureName: "更新された鍵",
      treasureDescription: "管理画面から更新した宝。",
      sortOrder: 1,
      isActive: true,
      answers: ["あたらしいひかり"]
    });

    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "編集確認");
    const oldAnswer = await service.unlock(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "305",
      "ひかり"
    );
    const newAnswer = await service.unlock(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "305",
      "あたらしいひかり"
    );

    expect(oldAnswer.result).toBe("incorrect");
    expect(newAnswer.result).toBe("correct");
    expect(newAnswer.treasure?.name).toBe("更新された鍵");
  });

  it("adds a new active room that players can explore", async () => {
    const service = makeService();

    await service.saveAdminRoom(DEFAULT_EVENT_ID, {
      roomCode: "777",
      exploreType: "show_puzzle",
      title: "新しい部屋",
      puzzleText: "追加された問題。",
      puzzleImageUrl: "",
      hiddenMessage: "",
      treasureName: "七の鍵",
      treasureDescription: "",
      sortOrder: 10,
      isActive: true,
      answers: ["なな"]
    });

    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "追加確認");
    const explored = await service.explore(DEFAULT_EVENT_ID, joined.player.id, "777");
    const unlocked = await service.unlock(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "777",
      "ナナ"
    );

    expect(explored.room?.title).toBe("新しい部屋");
    expect(unlocked.result).toBe("correct");
    expect(unlocked.treasure?.name).toBe("七の鍵");
  });
});

function makeService() {
  const repository = createMemoryRepository(createSeedMemoryState(now));
  return createNazoroomService(repository, { now: () => now });
}
