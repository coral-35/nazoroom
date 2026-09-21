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
      puzzleImageUrl: "",
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
      puzzleImageUrl: "",
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

    expect(explored.room?.roomCode).toBe("777");
    expect(answered.result).toBe("correct");
    expect(answered.clearedRoom?.roomCode).toBe("777");
  });

  it("updates problem bank rows and uses them in assignment saves", async () => {
    const service = makeService();
    const initial = await service.listAdminRooms(DEFAULT_EVENT_ID);
    const problem = initial.problems.find((item) => item.problemNumber === 3);
    expect(initial.problems).toHaveLength(27);
    expect(problem).toBeTruthy();

    await service.saveAdminProblem(DEFAULT_EVENT_ID, {
      id: problem?.id,
      roomCode: "303",
      puzzleImageUrl: "/puzzles/frame-03.png",
      answers: ["マスタから選んだ答え"]
    });
    await service.saveAdminAssignments(DEFAULT_EVENT_ID, [
      { problemId: initial.problems[0]?.id, isActive: true },
      { problemId: problem?.id, isActive: true }
    ]);

    const afterSave = await service.listAdminRooms(DEFAULT_EVENT_ID);
    const assignedRoom = afterSave.rooms.find((item) => item.problemId === problem?.id);
    expect(assignedRoom?.sortOrder).toBe(2);

    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "問題選択確認");
    const explored = await service.explore(DEFAULT_EVENT_ID, joined.player.id, "303");
    const answered = await service.answer(
      DEFAULT_EVENT_ID,
      joined.player.id,
      "303",
      "マスタから選んだ答え"
    );

    expect(explored.room?.puzzleImageUrl).toBe("/puzzles/frame-03.png");
    expect(answered.result).toBe("correct");
    expect(answered.clearedRoom?.treasureName).toBe("宝B");
  });

  it("assigns treasures to active rooms from top to bottom", async () => {
    const service = makeService();
    const initial = await service.listAdminRooms(DEFAULT_EVENT_ID);
    const problem1 = initial.problems.find((item) => item.problemNumber === 1);
    const problem2 = initial.problems.find((item) => item.problemNumber === 2);

    await service.saveAdminAssignments(DEFAULT_EVENT_ID, [
      { problemId: problem2?.id, isActive: true },
      { problemId: problem1?.id, isActive: true }
    ]);

    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "宝確認");
    const answered = await service.answer(DEFAULT_EVENT_ID, joined.player.id, "204", "ほし");

    expect(answered.result).toBe("correct");
    expect(answered.clearedRoom?.treasureName).toBe("宝A");
  });

  it("keeps the reserve problem visible to admins but inactive at runtime", async () => {
    const service = makeService();
    const initial = await service.listAdminRooms(DEFAULT_EVENT_ID);
    const reserve = initial.problems.find((item) => item.problemNumber === 27);
    expect(reserve?.isReserve).toBe(true);

    await service.saveAdminRoom(DEFAULT_EVENT_ID, {
      problemId: reserve?.id,
      roomCode: "27",
      puzzleImageUrl: "",
      sortOrder: 27,
      isActive: true,
      answers: ["予備答え"]
    });

    const afterSave = await service.listAdminRooms(DEFAULT_EVENT_ID);
    const reserveRoom = afterSave.rooms.find((item) => item.problemId === reserve?.id);
    const joined = await service.joinEvent(DEFAULT_EVENT_ID, "予備確認");
    const explored = await service.explore(DEFAULT_EVENT_ID, joined.player.id, "27");

    expect(reserveRoom?.isActive).toBe(false);
    expect(explored.resultType).toBe("not_found");
  });
});

function makeService() {
  const repository = createMemoryRepository(createSeedMemoryState(now));
  return createNazoroomService(repository, { now: () => now });
}
