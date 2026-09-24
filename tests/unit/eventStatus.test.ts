import { describe, expect, it } from "vitest";
import {
  canExploreRooms,
  getEventAvailability,
  isEventActive,
  isEventExpired
} from "@/lib/domain/eventStatus";
import type { EventRecord } from "@/lib/types/app";

const now = new Date("2026-07-09T10:00:00.000Z");

describe("event status helpers", () => {
  it("treats active events within the time window as active", () => {
    const event = makeEvent({
      startsAt: "2026-07-09T09:00:00.000Z",
      endsAt: "2026-07-09T11:00:00.000Z"
    });

    expect(getEventAvailability(event, now)).toBe("active");
    expect(isEventActive(event, now)).toBe(true);
  });

  it("treats future starts as not started", () => {
    const event = makeEvent({
      startsAt: "2026-07-09T10:30:00.000Z",
      endsAt: "2026-07-09T11:00:00.000Z"
    });

    expect(getEventAvailability(event, now)).toBe("not_started");
  });

  it("treats ended status or past end times as expired", () => {
    expect(
      isEventExpired(
        makeEvent({
          endsAt: "2026-07-09T09:59:00.000Z"
        }),
        now
      )
    ).toBe(true);
    expect(isEventExpired(makeEvent({ status: "ended" }), now)).toBe(true);
  });

  it("allows reflection exploration only while active or after results are published", () => {
    expect(canExploreRooms(makeEvent({ status: "draft" }), now)).toBe(false);
    expect(canExploreRooms(makeEvent({ status: "active" }), now)).toBe(true);
    expect(
      canExploreRooms(
        makeEvent({ status: "active", endsAt: "2026-07-09T09:59:00.000Z" }),
        now
      )
    ).toBe(false);
    expect(canExploreRooms(makeEvent({ status: "ended" }), now)).toBe(true);
  });
});

function makeEvent(partial: Partial<EventRecord>): EventRecord {
  return {
    id: "event",
    title: "event",
    status: "active",
    startsAt: null,
    endsAt: null,
    durationMinutes: 60,
    ...partial
  };
}
