import { describe, expect, it } from "vitest";
import { calculateLocalDeadline, parseLocalStart } from "@/lib/domain/localTimer";

describe("local event timer", () => {
  it("restores a start receipt for the same event signal", () => {
    expect(parseLocalStart('{"signal":"start-1","receivedAt":1000}')).toEqual({
      signal: "start-1",
      receivedAt: 1000
    });
    expect(parseLocalStart("invalid")).toBeNull();
  });

  it("calculates the deadline from the local receipt time", () => {
    expect(calculateLocalDeadline(1_000, 30)).toBe(1_801_000);
  });
});
