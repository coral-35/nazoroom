export const TREASURE_NAMES = Array.from({ length: 26 }, (_, index) =>
  `宝${String.fromCharCode(65 + index)}`
);

// Use the room's configured order so names never depend on acquisition order.
export function treasureNameForOrder(order: number | undefined): string | undefined {
  return order !== undefined && Number.isInteger(order)
    ? TREASURE_NAMES[order - 1]
    : undefined;
}
