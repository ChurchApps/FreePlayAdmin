import { playlistsTest as test, expect } from "./helpers/test-fixtures";

test.describe("Playlists", () => {
  test("create a playlist, add a Lessons.church item, save and reopen", async ({ page }) => {
    const name = "E2E Playlist " + Date.now();

    await page.getByTestId("add-playlist-button").click();
    await page.getByTestId("new-playlist-name").fill(name);
    await page.getByTestId("create-playlist").click();
    await expect(page).toHaveURL(/\/playlists\/[^/]+$/);
    await expect(page.getByTestId("command-palette-open")).toBeVisible();
    await expect(page.getByTestId("playlist-name")).toHaveText(name);

    await page.getByTestId("provider-tab-lessonschurch").click();

    const fileCards = page.getByTestId("browse-file-card");
    const folderCards = page.getByTestId("browse-folder-card");
    for (let depth = 0; depth < 8; depth++) {
      await expect(fileCards.first().or(folderCards.first())).toBeVisible({ timeout: 20000 });
      if (await fileCards.count()) break;
      await folderCards.first().click();
    }
    await fileCards.first().click();
    const items = page.getByTestId("playlist-item");
    await expect(items).toHaveCount(1);

    await page.getByTestId("add-all").click();
    await expect.poll(() => items.count()).toBeGreaterThan(1);
    await expect(page.getByTestId("add-all")).toBeDisabled();
    const added = await items.count();

    await page.getByTestId("save-playlist").click();
    await expect(page.getByTestId("save-playlist")).toBeDisabled();

    await page.reload();
    await expect(page.getByTestId("playlist-name")).toHaveText(name, { timeout: 20000 });
    await expect(items).toHaveCount(added);

    await page.goto("/playlists");
    await expect(page.getByTestId("playlist-row").filter({ hasText: name })).toBeVisible();

    await page.getByTestId("playlist-row").filter({ hasText: name }).getByRole("link", { name }).click();
    await page.getByTestId("delete-playlist").click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/playlists$/);
    await expect(page.getByTestId("playlist-row").filter({ hasText: name })).toHaveCount(0);
  });
});
