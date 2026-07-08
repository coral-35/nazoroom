import type { EventRecord } from "@/lib/types/app";

export type EventAvailability = "not_started" | "active" | "ended";

export function getEventAvailability(
  event: Pick<EventRecord, "status" | "startsAt" | "endsAt">,
  now: Date = new Date()
): EventAvailability {
  if (event.status === "ended") {
    return "ended";
  }

  if (event.startsAt && new Date(event.startsAt).getTime() > now.getTime()) {
    return "not_started";
  }

  if (event.endsAt && new Date(event.endsAt).getTime() <= now.getTime()) {
    return "ended";
  }

  if (event.status !== "active") {
    return "not_started";
  }

  return "active";
}

export function isEventActive(
  event: Pick<EventRecord, "status" | "startsAt" | "endsAt">,
  now: Date = new Date()
): boolean {
  return getEventAvailability(event, now) === "active";
}

export function isEventExpired(
  event: Pick<EventRecord, "status" | "startsAt" | "endsAt">,
  now: Date = new Date()
): boolean {
  return getEventAvailability(event, now) === "ended";
}
