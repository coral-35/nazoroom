import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cachePlayer,
  findCachedPlayer,
  playPathForCachedPlayer
} from "@/components/player/playerCache";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("player cache", () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: new MemoryStorage()
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage
    });
  });

  it("returns the preferred event player first", () => {
    cachePlayer("event-a", "player-a");
    cachePlayer("event-b", "player-b");

    expect(findCachedPlayer("event-a")).toEqual({
      eventId: "event-a",
      playerId: "player-a"
    });
  });

  it("falls back to the last cached event", () => {
    cachePlayer("event-a", "player-a");
    cachePlayer("event-b", "player-b");

    expect(findCachedPlayer("event-c")).toEqual({
      eventId: "event-b",
      playerId: "player-b"
    });
  });

  it("builds the current play path for the active event", () => {
    expect(
      playPathForCachedPlayer(
        { eventId: "event-a", playerId: "player a" },
        "event-a",
        "/play"
      )
    ).toBe("/play?playerId=player%20a");
  });

  it("builds the event-specific play path for a cached different event", () => {
    expect(
      playPathForCachedPlayer(
        { eventId: "event-b", playerId: "player-b" },
        "event-a",
        "/play"
      )
    ).toBe("/events/event-b/play?playerId=player-b");
  });
});
