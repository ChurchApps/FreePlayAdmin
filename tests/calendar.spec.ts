import { calendarTest as test, expect } from "./helpers/test-fixtures";
import { apiSession, type ApiSession } from "./helpers/api";

let session: ApiSession;
let groupId = "";
let playlistId = "";
const stamp = Date.now();
const groupName = "E2E Group " + stamp;
const playlistName = "E2E Loop " + stamp;

test.beforeAll(async () => {
  session = await apiSession();
  const [playlist] = await session.post("/doing/playlists", [{ name: playlistName, items: [] }]);
  playlistId = playlist.id;
  const [group] = await session.post("/doing/screenGroups", [{ name: groupName }]);
  groupId = group.id;
});

test.afterAll(async () => {
  const entries = await session.get("/doing/scheduleEntries/group/" + groupId);
  for (const e of Array.isArray(entries) ? entries : []) await session.del("/doing/scheduleEntries/" + e.id);
  await session.del("/doing/screenGroups/" + groupId);
  await session.del("/doing/playlists/" + playlistId);
  await session.dispose();
});

test.describe("Calendar", () => {
  test("add, edit and delete a weekly schedule", async ({ page }) => {
    await page.goto("/calendar?group=" + groupId);
    await expect(page.getByTestId("group-tab-" + groupId)).toHaveAttribute("aria-selected", "true", { timeout: 20000 });
    await expect(page.getByTestId("week-grid")).toBeVisible();
    const entries = page.getByTestId("calendar-entry");
    await expect(entries).toHaveCount(0);

    await page.getByTestId("add-schedule-button").click();
    const sheet = page.getByTestId("schedule-sheet");
    await expect(sheet).toBeVisible();
    await sheet.getByTestId("schedule-play").click();
    await page.getByRole("option", { name: playlistName }).click();
    await page.getByTestId("schedule-start").fill("09:00");
    await page.getByTestId("schedule-end").fill("10:00");
    await page.getByTestId("schedule-save").click();
    await expect(sheet).toBeHidden();

    await expect(entries.first()).toBeVisible();
    await expect(entries.first()).toContainText(playlistName);

    await entries.first().click();
    await expect(sheet).toContainText("Edit schedule");
    await page.getByTestId("schedule-end").fill("11:00");
    await page.getByTestId("schedule-save").click();
    await expect(sheet).toBeHidden();
    await expect(entries.first()).toContainText("11:00 AM");

    await entries.first().click();
    await page.getByTestId("schedule-delete").click();
    await expect(sheet).toBeHidden();
    await expect(entries).toHaveCount(0);
  });

  test("replaces hold the last slide with Teacher paced", async ({ page }) => {
    await page.goto("/calendar?group=" + groupId);
    await expect(page.getByTestId("group-tab-" + groupId)).toHaveAttribute("aria-selected", "true", { timeout: 20000 });
    const entries = page.getByTestId("calendar-entry");
    await expect(entries).toHaveCount(0);

    await page.getByTestId("add-schedule-button").click();
    const sheet = page.getByTestId("schedule-sheet");
    await expect(sheet.getByText("Play once, then hold the last slide")).toHaveCount(0);
    await sheet.getByRole("radio", { name: /Teacher paced/ }).check();
    await sheet.getByTestId("schedule-play").click();
    await page.getByRole("option", { name: playlistName }).click();
    await page.getByTestId("schedule-start").fill("09:00");
    await page.getByTestId("schedule-end").fill("10:00");
    await page.getByTestId("schedule-save").click();
    await expect(sheet).toBeHidden();

    await expect(entries.first()).toContainText("teacher paced");
    const saved = await session.get("/doing/scheduleEntries/group/" + groupId);
    expect(saved.map((e: { endBehavior?: string }) => e.endBehavior)).toEqual(["teacherPaced"]);

    await entries.first().click();
    await expect(sheet.getByRole("radio", { name: /Teacher paced/ })).toBeChecked();
    await page.getByTestId("schedule-delete").click();
    await expect(sheet).toBeHidden();
    await expect(entries).toHaveCount(0);
  });

  test("opens a schedule saved as hold last as Teacher paced", async ({ page }) => {
    const today = new Date();
    const date = today.toISOString().slice(0, 10);
    const day = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][today.getUTCDay()];
    await session.post("/doing/scheduleEntries", [
      {
        screenGroupId: groupId,
        targetType: "playlist",
        targetId: playlistId,
        start: date + "T09:00:00",
        end: date + "T10:00:00",
        recurrenceRule: "FREQ=WEEKLY;BYDAY=" + day,
        endBehavior: "holdLast",
        enabled: true
      }
    ]);

    await page.goto("/calendar?group=" + groupId);
    await expect(page.getByTestId("group-tab-" + groupId)).toHaveAttribute("aria-selected", "true", { timeout: 20000 });
    const entries = page.getByTestId("calendar-entry");
    await expect(entries.first()).toContainText("teacher paced");
    await entries.first().click();
    const sheet = page.getByTestId("schedule-sheet");
    await expect(sheet.getByRole("radio", { name: /Teacher paced/ })).toBeChecked();
    await expect(sheet.getByText("Play once, then hold the last slide")).toHaveCount(0);
    await page.getByTestId("schedule-save").click();
    await expect(sheet).toBeHidden();

    const saved = await session.get("/doing/scheduleEntries/group/" + groupId);
    expect(saved.map((e: { endBehavior?: string }) => e.endBehavior)).toEqual(["teacherPaced"]);

    await entries.first().click();
    await page.getByTestId("schedule-delete").click();
    await expect(entries).toHaveCount(0);
  });
});
