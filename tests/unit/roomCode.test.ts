import { describe, expect, it } from "vitest";
import { parseRoomCode } from "@/lib/validations/schemas";

describe("room number validation", () => {
  it("accepts one to six digits, leading zeroes and full-width digits", () => {
    for (const value of ["1", "123456", "000001", "１２３４５６"]) {
      expect(parseRoomCode(value)).toBe(value);
    }
  });

  it("rejects empty, long and non-numeric room numbers", () => {
    for (const value of ["", "1234567", "A-01", "12.3", "-1", "ab12", null]) {
      expect(() => parseRoomCode(value)).toThrow();
    }
  });
});
