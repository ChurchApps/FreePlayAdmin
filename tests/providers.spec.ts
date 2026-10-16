import { providersTest as test, expect } from "./helpers/test-fixtures";

test.describe("Providers", () => {
  test("lists connected and available providers", async ({ page }) => {
    await expect(page.locator("#page-header-title")).toHaveText("Providers");
    await expect(page.getByRole("heading", { name: "Connected" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Available" })).toBeVisible();

    const rows = page.locator("[data-testid^='provider-row-']");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThanOrEqual(5);

    await expect(page.getByTestId("provider-row-dropbox")).toBeVisible();
    await expect(page.getByTestId("provider-row-freeshow")).toContainText("On your church network");
  });
});
