import type { ExploredRoomCard } from "@/lib/types/app";

export function sortExploredRoomCards(
  cards: ExploredRoomCard[]
): ExploredRoomCard[] {
  return [...cards].sort((a, b) => {
    const unlockedOrder = Number(Boolean(a.unlocked)) - Number(Boolean(b.unlocked));
    if (unlockedOrder !== 0) {
      return unlockedOrder;
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
