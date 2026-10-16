import type { Page } from "@playwright/test";

export async function login(page: Page) {
  await page.goto("/screens");

  const emailInput = page.locator('input[type="email"]');
  const navButton = page.getByTestId("command-palette-open");

  const winner = await Promise.race([
    navButton.waitFor({ state: "visible", timeout: 15000 }).then(() => "authenticated" as const).catch((): null => null),
    emailInput.waitFor({ state: "visible", timeout: 15000 }).then(() => "login" as const).catch((): null => null)
  ]);

  if (winner === "authenticated") return;
  if (winner === null) throw new Error("Neither login form nor authenticated nav appeared within 15s");

  await emailInput.fill("demo@b1.church");
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');

  const churchDialog = page.locator('[role="dialog"]').filter({ hasText: "Select a Church" });
  await Promise.race([
    churchDialog.waitFor({ state: "visible", timeout: 15000 }).catch(() => { }),
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 }).catch(() => { })
  ]);

  if (await churchDialog.isVisible().catch(() => false)) {
    await page
      .locator('[role="dialog"] h3:has-text("Grace Community Church")')
      .first()
      .or(page.locator('[role="dialog"] h3:has-text("Gracious Community Church")').first())
      .click({ timeout: 10000 });
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
  }
  await navButton.waitFor({ state: "visible", timeout: 15000 });
}
