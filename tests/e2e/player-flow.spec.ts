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

  await expect(page.getByText("プレイヤー画面", { exact: true })).toHaveCount(0);
  await expect(page.locator(".treasure-slot")).toHaveCount(25);
  await expect(page.getByText("宝Z", { exact: true })).toHaveCount(0);
  const inputBox = await page.getByLabel("部屋番号").boundingBox();
  const treasureBox = await page.getByRole("heading", { name: "ゲットした宝" }).boundingBox();
  expect(inputBox?.y).toBeLessThan(treasureBox?.y ?? 0);

  await page.getByLabel("部屋番号").fill("204");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.locator(".explore-feedback")).toContainText("204");
  await expect(page.getByText(/違和感|現地探索型の部屋です/)).toHaveCount(0);

  await page.getByLabel("部屋番号").fill("999");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText(/見つからなかった/).first()).toBeVisible();

  await page.getByLabel("部屋番号").fill("305");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText("時計の針が示す言葉を読め。")).toBeVisible();

  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText(/部屋 305 は探索済み/)).toBeVisible();
  await expect(page.getByRole("article", { name: "部屋 305 の謎" })).toHaveCount(1);

  await page.getByLabel("解答").fill("やみ");
  await page.getByRole("button", { name: "解答" }).click();
  await expect(page.getByText(/不正解/)).toBeVisible();

  await page.getByLabel("解答").fill("ヒカリ");
  await page.getByRole("button", { name: "解答" }).click();
  await expect(page.getByText(/部屋 305 をクリア/).first()).toBeVisible();

  await expect(page.getByText("宝A", { exact: true })).toBeVisible();

  await page.getByLabel("解答").fill("ひかり");
  await page.getByRole("button", { name: "解答" }).click();
  await expect(page.getByText(/すでにクリア/)).toBeVisible();

  const publishResponse = await page.request.post("/api/admin/event/control", {
    data: { action: "publish_results" }
  });
  expect(publishResponse.ok()).toBeTruthy();

  const rankingTitle = page.getByRole("heading", { name: "ランキング" });
  const explorationTitle = page.getByRole("heading", { name: "ゲットした宝" });
  await expect(rankingTitle).toBeVisible();
  await expect(page.getByRole("button", { name: "解答" })).toBeDisabled();

  const rankingBox = await rankingTitle.boundingBox();
  const explorationBox = await explorationTitle.boundingBox();
  expect(rankingBox?.y).toBeLessThan(explorationBox?.y ?? 0);

  await page.getByLabel("部屋番号").fill("A-01");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText("封筒に描かれた線を順にたどれ。")).toBeVisible();
});
