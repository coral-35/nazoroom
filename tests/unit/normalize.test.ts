import { describe, expect, it } from "vitest";
import { normalizeAnswer, normalizeRoomCode } from "@/lib/domain/normalize";

describe("normalizeRoomCode", () => {
  it("trims, normalizes width, uppercases, and removes spaces", () => {
    expect(normalizeRoomCode(" a-01 ")).toBe("A-01");
    expect(normalizeRoomCode("Ａ－０１")).toBe("A-01");
    expect(normalizeRoomCode("room 1")).toBe("ROOM1");
  });
});

describe("normalizeAnswer", () => {
  it("normalizes width, case, spaces, and katakana", () => {
    expect(normalizeAnswer(" ヒカリ ")).toBe("ひかり");
    expect(normalizeAnswer("ひかり")).toBe("ひかり");
    expect(normalizeAnswer("HIKARI")).toBe("hikari");
    expect(normalizeAnswer("ｈｉｋａｒｉ")).toBe("hikari");
  });
});
