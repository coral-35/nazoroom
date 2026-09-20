import { describe, expect, it } from "vitest";
import { formatElapsed } from "@/components/player/CountdownTimer";

describe("elapsed timer", () => {
  it("formats elapsed milliseconds from zero and rounds down", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(59_999)).toBe("00:59");
    expect(formatElapsed(60_000)).toBe("01:00");
    expect(formatElapsed(3_661_000)).toBe("61:01");
  });
});
