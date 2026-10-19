import { calendarTest as test, expect } from "./helpers/test-fixtures";

// Issue #1296: the calendar must read times in the zone the TV uses (the church's), not the browser's.
test.use({ timezoneId: "America/Los_Angeles" });

test("calendar uses the church time zone, not the browser's", async ({ page }) => {
  await expect(page.getByText(/What plays when, per screen group/)).toContainText("America/Chicago");
});
