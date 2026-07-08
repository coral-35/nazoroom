import { expect, test } from "@playwright/test";

const defaultEventId = "00000000-0000-0000-0000-000000000001";

test("player can join, explore, unlock, and avoid duplicate treasure", async ({ page }) => {
  await page.goto(`/events/${defaultEventId}/join`);

  await page.getByLabel("ニックネーム").fill(`E2E-${Date.now()}`);
  await page.getByRole("button", { name: "参加する" }).click();

  await expect(page.getByText("残り時間")).toBeVisible();

  await page.getByLabel("部屋番号").fill("999");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText(/見つからなかった/)).toBeVisible();

  await page.getByLabel("部屋番号").fill("305");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText("古びた時計の暗号")).toBeVisible();

  await page.getByLabel("解答").fill("やみ");
  await page.getByRole("button", { name: "解錠" }).click();
  await expect(page.getByText(/答えが違う/)).toBeVisible();

  await page.getByLabel("解答").fill("ヒカリ");
  await page.getByRole("button", { name: "解錠" }).click();
  await expect(page.getByText(/月の鍵/)).toBeVisible();

  await page.getByLabel("解答").fill("ひかり");
  await page.getByRole("button", { name: "解錠" }).click();
  await expect(page.getByText(/すでに入手済み/)).toBeVisible();
});
