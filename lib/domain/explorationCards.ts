import type { ExploredRoomCard } from "@/lib/types/app";

export function sortExploredRoomCards(
  cards: ExploredRoomCard[]
): ExploredRoomCard[] {
  return [...cards].sort((a, b) => {
    const clearedOrder = Number(Boolean(a.cleared)) - Number(Boolean(b.cleared));
    if (clearedOrder !== 0) {
      return clearedOrder;
    }

    const createdOrder = toTime(a.createdAt) - toTime(b.createdAt);
    if (createdOrder !== 0) {
      return createdOrder;
    }

    return a.roomCode.localeCompare(b.roomCode) || a.logId.localeCompare(b.logId);
  });
}

function toTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}
