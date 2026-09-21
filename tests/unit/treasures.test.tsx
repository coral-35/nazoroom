import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClearedRoomList } from "@/components/player/ClearedRoomList";
import { PuzzleCard } from "@/components/player/PuzzleCard";
import { treasureNameForOrder } from "@/lib/domain/treasures";

describe("treasure collection", () => {
  it("maps configured orders to A–Z without wrapping invalid orders", () => {
    expect(treasureNameForOrder(1)).toBe("宝A");
    expect(treasureNameForOrder(25)).toBe("宝Y");
    expect(treasureNameForOrder(26)).toBe("宝Z");
    for (const order of [undefined, 0, 27, 1.5]) {
      expect(treasureNameForOrder(order)).toBeUndefined();
    }
  });

  it("keeps 25 blank positions and conceals the secret until acquired", () => {
    const html = renderToStaticMarkup(createElement(ClearedRoomList, { clearedRooms: [] }));
    expect(html.match(/class="treasure-slot"/g)).toHaveLength(25);
    expect(html).not.toMatch(/宝[A-Z]/);
  });

  it("shows acquired treasures at fixed positions and Z in the extra position", () => {
    const html = renderToStaticMarkup(createElement(ClearedRoomList, {
      clearedRooms: ["宝Z", "宝Y", "宝A"].map((treasureName, index) => ({
        treasureName, roomCode: String(index), clearedAt: "2026-09-20"
      }))
    }));
    expect(html.match(/data-acquired="true"/g)).toHaveLength(3);
    expect(html.indexOf("宝A")).toBeLessThan(html.indexOf("宝Y"));
    expect(html.indexOf("宝Y")).toBeLessThan(html.indexOf("宝Z"));
    expect(html).not.toContain("宝B");
  });

  it("does not render room messages inside puzzle cards", () => {
    const html = renderToStaticMarkup(createElement(PuzzleCard, { card: {
      logId: "visible", roomCode: "204", resultType: "show_puzzle",
      message: "違和感がある", createdAt: "2026-09-20"
    } }));
    expect(html).toContain("部屋 204");
    expect(html).not.toContain("違和感");
  });
});
