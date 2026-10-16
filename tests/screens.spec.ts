import { screensTest as test, expect } from "./helpers/test-fixtures";

test.describe("Screens", () => {
  test("list renders with header, stats and search", async ({ page }) => {
    await expect(page.locator("#page-header-title")).toHaveText("Screens");
    await expect(page.locator("#page-header-statistics")).toContainText("Online now");
    await expect(page.locator("#page-header-statistics")).toContainText("Ready for Sunday");
    await expect(page.locator("#page-header-statistics")).toContainText("Needs attention");
    await expect(page.getByTestId("screens-search")).toBeVisible();
    await expect(page.getByTestId("pair-screen-button")).toBeVisible();
  });

  test("filter chips toggle", async ({ page }) => {
    const all = page.getByRole("button", { name: "All", exact: true });
    const scheduled = page.getByRole("button", { name: "Scheduled", exact: true });
    const attention = page.getByRole("button", { name: "Needs attention", exact: true });
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await scheduled.click();
    await expect(scheduled).toHaveAttribute("aria-pressed", "true");
    await expect(all).toHaveAttribute("aria-pressed", "false");
    await attention.click();
    await expect(attention).toHaveAttribute("aria-pressed", "true");
    await all.click();
    await expect(all).toHaveAttribute("aria-pressed", "true");
  });

  test("groups view toggles from the header", async ({ page }) => {
    await page.getByTestId("groups-toggle").click();
    await expect(page).toHaveURL(/view=groups/);
    await expect(page.locator("#page-header-title")).toHaveText("Screen groups");
    await expect(page.getByTestId("command-palette-open")).toBeVisible();
    await expect(page.getByTestId("pair-screen-button")).toHaveCount(0);
    await page.getByTestId("add-group-button").click();
    await expect(page.getByTestId("group-form")).toBeVisible();
    await page.getByTestId("group-form").getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByTestId("group-form")).toHaveCount(0);
    await page.getByTestId("groups-toggle").click();
    await expect(page.locator("#page-header-title")).toHaveText("Screens");
  });

  test("pair form validates the code", async ({ page }) => {
    await page.getByTestId("pair-screen-button").click();
    const form = page.getByTestId("pair-screen-form");
    await expect(form).toBeVisible();

    await form.getByLabel("Manual").check();
    const code = page.getByTestId("pair-code");
    await code.fill("ab");
    await page.getByTestId("pair-submit").click();
    await expect(form).toContainText("The code is four letters.");

    await code.fill("zqzq");
    await expect(code).toHaveValue("ZQZQ");
    await page.getByTestId("pair-label").fill("E2E Bad code");
    await page.getByTestId("pair-submit").click();
    await expect(form).toContainText("That code didn't match a TV");
  });
});
