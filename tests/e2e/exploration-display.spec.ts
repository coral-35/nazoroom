import { expect, test } from "@playwright/test";
import type { ExploredRoomCard } from "../../lib/types/app";

test("explored rooms remain available with full 800 by 600 puzzles", async ({ page }) => {
  const cards: ExploredRoomCard[] = [];
  const puzzleImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="white"/><text x="20" y="40">Puzzle</text></svg>')}`;
  await page.route("**/api/events/*/state?*", (route) => route.fulfill({ json: {
    event: { id: "display", title: "謎解きダンジョン", status: "active", startsAt: new Date().toISOString(), endsAt: null, durationMinutes: 60 },
    player: { id: "display-player", nickname: "テスト" },
    explorationLogs: cards, clearedRooms: [], ranking: null
  } }));
  await page.route("**/api/events/*/explore", (route) => {
    const { roomCode } = route.request().postDataJSON();
    expect(route.request().postDataJSON()).toEqual({ playerId: "display-player", roomCode });
    const card: ExploredRoomCard = {
      logId: roomCode, roomCode, createdAt: new Date().toISOString(),
      resultType: roomCode === "204" ? "hidden_clue" : "show_puzzle",
      message: "削除した部屋の説明", puzzleText: "謎本文", puzzleImageUrl: roomCode === "307" ? undefined : puzzleImage,
      cleared: roomCode === "306"
    };
    cards.push(card);
    return route.fulfill({ json: { resultType: card.resultType, message: "探索しました", card, alreadyExplored: false, room: null } });
  });
  await page.goto("/events/display/play?playerId=display-player");
  await expect(page.getByText("まだ部屋を探索していません")).toBeVisible();
  const initialFrame = await page.locator(".puzzle-panel").boundingBox();
  for (const room of ["305", "306", "204", "307"]) {
    await page.getByLabel("部屋番号").fill(room);
    await page.getByRole("button", { name: "探索", exact: true }).click();
    await expect(page.getByRole("heading", { name: `部屋 ${room}`, exact: true })).toHaveCount(1);
    const frame = await page.locator(".puzzle-panel").boundingBox();
    expect(frame!.width).toBe(initialFrame!.width);
    expect(frame!.height).toBe(initialFrame!.height);
  }
  await page.getByLabel("部屋番号").fill("999");
  await expect(page.locator(".puzzle-card")).toHaveCount(4);
  await expect(page.getByText("削除した部屋の説明")).toHaveCount(0);
  await expect(page.getByText("謎本文", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("article", { name: "部屋 307 の謎", exact: true }).locator("img")).toHaveCount(0);
  await expect(page.getByRole("article", { name: "部屋 204 の謎", exact: true }).locator("img")).toHaveCount(0);
  await expect(page.getByRole("article", { name: "部屋 306 の謎", exact: true }).getByText("クリア済み")).toHaveCount(1);
  const image = page.getByRole("img", { name: "部屋 305 の謎画像", exact: true });
  for (const width of [320, 393, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(image).toHaveAttribute("width", "800");
    await expect(image).toHaveAttribute("height", "600");
    const size = await image.boundingBox();
    expect(size!.width / size!.height).toBeCloseTo(4 / 3, 2);
    await expect(image).toHaveCSS("object-fit", "contain");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
  const lastCard = page.getByRole("article", { name: "部屋 306 の謎", exact: true });
  await lastCard.scrollIntoViewIfNeeded();
  await expect(lastCard).toBeInViewport();
  await page.getByRole("button", { name: "未クリアへ" }).click();
  await expect(page.getByRole("article", { name: "部屋 305 の謎", exact: true })).toBeInViewport();
  await page.reload();
  await expect(page.locator(".puzzle-card")).toHaveCount(4);
});
