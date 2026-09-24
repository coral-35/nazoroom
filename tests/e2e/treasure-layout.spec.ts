import { expect, test } from "@playwright/test";

test("compact collection stays below inputs and reveals acquired Z", async ({ page }) => {
  let published = false;
  const clearedRooms: { roomCode: string; clearedAt: string; treasureName: string }[] = [];
  await page.route("**/api/events/*/state?*", (route) => route.fulfill({ json: {
    event: { id: "layout", title: "謎解きダンジョン", status: published ? "ended" : "active", startsAt: new Date().toISOString(), endsAt: null, durationMinutes: 60 },
    player: { id: "layout-player", nickname: "テスト" },
    explorationLogs: [], clearedRooms, ranking: published ? {
      totalPlayers: 2, roomScores: [], ranking: [
        { playerId: "other", nickname: "他の人", score: 30, clearedRooms: [], clearedRoomCount: 0, lastClearedAt: null },
        { playerId: "layout-player", nickname: "テスト", score: 12, clearedRooms: ["123456"], clearedRoomCount: 1, lastClearedAt: null }
      ]
    } : null
  } }));
  await page.route("**/api/events/*/answer", (route) => {
    expect(route.request().postDataJSON()).toEqual({ playerId: "layout-player", roomCode: "123456", answer: "answer" });
    clearedRooms.push({ roomCode: "123456", clearedAt: new Date().toISOString(), treasureName: "宝Z" });
    return route.fulfill({ json: { result: "correct", message: "正解", clearedRoom: clearedRooms[0] } });
  });
  await page.goto("/events/layout/play?playerId=layout-player");
  await expect(page.getByText("経過時間", { exact: true })).toBeVisible();
  await expect(page.getByText("残り時間", { exact: true })).toHaveCount(0);
  await expect(page.locator(".timer-value")).toHaveText(/^00:0[0-9]$/);
  await expect(page.getByRole("heading", { name: "ゲットした宝" })).toBeVisible();
  await expect(page.locator(".treasure-slot")).toHaveCount(25);
  await expect(page.getByText("宝Z", { exact: true })).toHaveCount(0);
  await expect(page.getByText("プレイヤー画面", { exact: true })).toHaveCount(0);
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 667 });
    const controls = await page.locator(".control-bar").boundingBox();
    expect((await page.locator(".input-flow").boundingBox())!.height).toBe(104);
    for (const id of ["room-code", "answer"]) {
      const label = await page.locator(`label[for="${id}"] span`).boundingBox();
      const input = await page.locator(`#${id}`).boundingBox();
      expect(label!.x + label!.width).toBeLessThan(input!.x);
      expect(label!.y + label!.height / 2).toBeCloseTo(input!.y + input!.height / 2, 0);
    }
    const collection = await page.locator(".treasure-panel").boundingBox();
    expect(controls!.y + controls!.height).toBeLessThan(collection!.y);
    const columns = await page.locator(".treasure-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(5);
    const rows = await page.locator(".treasure-grid").evaluate((el) => getComputedStyle(el).gridTemplateRows.split(" ").length);
    expect(rows).toBe(6);
    await expect(page.locator(".treasure-slot").first()).toHaveCSS("border-top-width", "0px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
  await expect(page.locator(".flow-connections")).toBeVisible();
  await expect(page.getByRole("button", { name: "探索", exact: true })).toHaveAccessibleDescription("部屋番号のみを送信");
  await expect(page.getByRole("button", { name: "解答", exact: true })).toHaveAccessibleDescription("部屋番号と解答を送信");
  await expect(page.getByText("部屋番号＋解答", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "探索", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "解答", exact: true })).toBeDisabled();
  const roomInput = page.getByPlaceholder("部屋番号を入力");
  await expect(page.getByPlaceholder("解答を入力")).toBeVisible();
  await roomInput.fill("1234567");
  await expect(roomInput).toHaveValue("123456");
  await roomInput.fill("");
  await roomInput.pressSequentially("ab-12");
  await expect(roomInput).toHaveValue("12");
  await roomInput.fill("123456");
  await expect(page.getByRole("button", { name: "探索", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "解答", exact: true })).toBeDisabled();
  await page.getByLabel("解答", { exact: true }).fill("answer");
  await page.getByRole("button", { name: "解答", exact: true }).click();
  await expect(page.getByText("宝Z", { exact: true })).toBeVisible();
  await expect(page.locator(".treasure-slot")).toHaveCount(26);
  await page.reload();
  await expect(page.getByText("宝Z", { exact: true })).toBeVisible();
  published = true;
  await expect(page.getByLabel("自分の結果")).toHaveText("結果12点 / 2位");
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 667 });
    const result = await page.getByLabel("自分の結果").boundingBox();
    const timer = await page.locator(".timer-box").boundingBox();
    const controls = await page.locator(".control-bar").boundingBox();
    expect(result!.x + result!.width).toBeLessThan(timer!.x);
    expect(result!.y).toBe(timer!.y);
    const ranking = await page.locator(".result-ranking").boundingBox();
    expect(ranking!.y + ranking!.height).toBeLessThan(controls!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
  await expect(page.locator(".play-shell > .result-ranking + .control-bar")).toHaveCount(1);
});

test("closed exploration shows waiting notice above disabled controls", async ({ page }) => {
  await page.route("**/api/events/*/state?*", (route) => route.fulfill({ json: {
    event: {
      id: "closed",
      title: "謎解きダンジョン",
      status: "active",
      startsAt: "2026-07-09T09:00:00.000Z",
      endsAt: "2026-07-09T10:00:00.000Z",
      durationMinutes: 60
    },
    player: { id: "closed-player", nickname: "テスト" },
    explorationLogs: [],
    clearedRooms: [],
    ranking: null
  } }));

  await page.goto("/events/closed/play?playerId=closed-player");
  await expect(page.getByRole("heading", { name: "結果発表待ち" })).toBeVisible();
  await expect(page.getByText("探索時間は終了しました。")).toBeVisible();
  await page.getByPlaceholder("部屋番号を入力").fill("305");
  await expect(page.getByRole("button", { name: "探索", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "解答", exact: true })).toBeDisabled();

  const waiting = await page.locator(".result-waiting").boundingBox();
  const controls = await page.locator(".control-bar").boundingBox();
  expect(waiting!.y + waiting!.height).toBeLessThan(controls!.y);
});
