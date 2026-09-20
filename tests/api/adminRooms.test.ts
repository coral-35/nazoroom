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
      sortOrder: 1,
      isActive: true,
      answers: ["あたらしいひかり"]
    });

    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "編集確認");
    const oldAnswer = await service.answer(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "305",
      "ひかり"
    );
    const newAnswer = await service.answer(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "305",
      "あたらしいひかり"
    );

    expect(oldAnswer.result).toBe("incorrect");
    expect(newAnswer.result).toBe("correct");
    expect(newAnswer.clearedRoom?.roomCode).toBe("305");
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
      sortOrder: 10,
      isActive: true,
      answers: ["なな"]
    });

    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "追加確認");
    const explored = await service.explore(DEFAULT_EVENT_ID, joined.player.id, "777");
    const answered = await service.answer(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "777",
      "ナナ"
    );

    expect(explored.room?.title).toBe("新しい部屋");
    expect(answered.result).toBe("correct");
    expect(answered.clearedRoom?.roomCode).toBe("777");
  });

  it("selects a problem from the bank and keeps editable answers", async () => {
    const service = makeService();
    const initial = await service.listAdminRooms(DEFAULT_EVENT_ID);
    const problem = initial.problems.find((item) => item.problemNumber === 3);
    const room = initial.rooms.find((item) => item.roomCode === "101");
    expect(initial.problems).toHaveLength(27);
    expect(problem).toBeTruthy();

    await service.saveAdminRoom(DEFAULT_EVENT_ID, {
      id: room?.id,
      problemId: problem?.id,
      roomCode: "999",
      exploreType: "show_puzzle",
      title: "手入力より問題マスタが優先",
      puzzleText: "表示しない",
      puzzleImageUrl: "",
      hiddenMessage: "",
      sortOrder: 4,
      isActive: true,
      answers: ["マスタから選んだ答え"]
    });

    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "問題選択確認");
    const explored = await service.explore(DEFAULT_EVENT_ID, joined.player.id, "101");
    const wrongRoom = await service.explore(DEFAULT_EVENT_ID, joined.player.id, "999");
    const answered = await service.answer(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "101",
      "マスタから選んだ答え"
    );

    expect(explored.room?.puzzleImageUrl).toBe("/puzzles/frame-03.png");
    expect(wrongRoom.resultType).toBe("not_found");
    expect(answered.result).toBe("correct");
    expect(answered.clearedRoom?.treasureName).toBe("宝D");
  });
});

function makeService() {
  const repository = createMemoryRepository(createSeedMemoryState(now));
  return createNazoroomService(repository, { now: () => now });
}
