import { expect, test } from "@playwright/test";

const defaultEventId = "00000000-0000-0000-0000-000000000001";

test("player can explore, unlock, and avoid duplicate treasure", async ({ page }) => {
  const resetResponse = await page.request.post(
    `/api/admin/events/${defaultEventId}/control`,
    {
      data: { action: "reset" }
    }
  );
  expect(resetResponse.ok()).toBeTruthy();

  const startResponse = await page.request.post(
    `/api/admin/events/${defaultEventId}/control`,
    {
      data: { action: "start_exploration", durationMinutes: 60 }
    }
  );
  expect(startResponse.ok()).toBeTruthy();

  const nickname = `E2E-${Date.now()}`;
  const joinResponse = await page.request.post(`/api/events/${defaultEventId}/join`, {
    data: { nickname }
  });
  expect(joinResponse.ok()).toBeTruthy();
  const joined = (await joinResponse.json()) as { player: { id: string } };

  await page.goto(`/events/${defaultEventId}/play?playerId=${joined.player.id}`);
  await page.evaluate(
    ([eventId, playerId]) => {
      localStorage.setItem(`nazoroom.player.${eventId}`, playerId);
    },
    [defaultEventId, joined.player.id]
  );

  await expect(page.getByText("残り時間")).toBeVisible();

  await page.getByLabel("部屋番号").fill("999");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText(/見つからなかった/).first()).toBeVisible();

  await page.getByLabel("部屋番号").fill("305");
  await page.getByRole("button", { name: "探索" }).click();
  await expect(page.getByText("古びた時計の暗号")).toBeVisible();

  await page.getByLabel("解答").fill("やみ");
  await page.getByRole("button", { name: "解錠" }).click();
  await expect(page.getByText(/答えが違う/)).toBeVisible();

  await page.getByLabel("解答").fill("ヒカリ");
  await page.getByRole("button", { name: "解錠" }).click();
  await expect(page.getByText(/月の鍵/).first()).toBeVisible();

  await page.getByLabel("解答").fill("ひかり");
  await page.getByRole("button", { name: "解錠" }).click();
  await expect(page.getByText(/すでに入手済み/)).toBeVisible();
});
