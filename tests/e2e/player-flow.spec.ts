import { expect, test } from "@playwright/test";

test("player can explore, answer, and avoid duplicate clears", async ({ page }) => {
  const resetResponse = await page.request.post("/api/admin/event/control", {
    data: { action: "reset" }
  });
  expect(resetResponse.ok()).toBeTruthy();

  const nickname = `E2E-${Date.now()}`;
  const joinResponse = await page.request.post("/api/event/join", {
    data: { nickname }
  });
  expect(joinResponse.ok()).toBeTruthy();
  const joined = (await joinResponse.json()) as { player: { id: string } };

  await page.goto(`/play?playerId=${joined.player.id}`);
  await expect(page.getByText("開始を待っています")).toBeVisible();

  const startResponse = await page.request.post("/api/admin/event/control", {
    data: { action: "start_exploration", durationMinutes: 60 }
  });
  expect(startResponse.ok()).toBeTruthy();

  await expect(page.getByText("残り時間")).toBeVisible();

  await page.getByLabel("部屋番号").fill("999");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText(/見つからなかった/).first()).toBeVisible();

  await page.getByLabel("部屋番号").fill("305");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText("古びた時計の暗号")).toBeVisible();

  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText(/部屋 305 は探索済み/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "部屋 305" })).toHaveCount(1);

  await page.getByLabel("解答").fill("やみ");
  await page.getByRole("button", { name: "解答" }).click();
  await expect(page.getByText(/不正解/)).toBeVisible();

  await page.getByLabel("解答").fill("ヒカリ");
  await page.getByRole("button", { name: "解答" }).click();
  await expect(page.getByText(/部屋 305 をクリア/).first()).toBeVisible();

  await page.getByLabel("解答").fill("ひかり");
  await page.getByRole("button", { name: "解答" }).click();
  await expect(page.getByText(/すでにクリア/)).toBeVisible();

  const publishResponse = await page.request.post("/api/admin/event/control", {
    data: { action: "publish_results" }
  });
  expect(publishResponse.ok()).toBeTruthy();

  const rankingTitle = page.getByRole("heading", { name: "ランキング" });
  const explorationTitle = page.getByRole("heading", { name: "見つけた部屋" });
  await expect(rankingTitle).toBeVisible();
  await expect(page.getByRole("button", { name: "解答" })).toBeDisabled();

  const rankingBox = await rankingTitle.boundingBox();
  const explorationBox = await explorationTitle.boundingBox();
  expect(rankingBox?.y).toBeLessThan(explorationBox?.y ?? 0);

  await page.getByLabel("部屋番号").fill("A-01");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText("封筒の記号")).toBeVisible();
});
