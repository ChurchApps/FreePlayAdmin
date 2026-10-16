import { test as base, type Page } from "@playwright/test";
import { login } from "./auth";

// Each fixture logs in and opens its section; import as `test`.
const sectionTest = (url: string) =>
  base.extend({
    page: async ({ page }, run) => {
      await login(page);
      await page.goto(url);
      await page.locator("#page-header-title").waitFor({ state: "visible", timeout: 15000 });
      await run(page);
    }
  });

export const loggedInTest = base.extend({
  page: async ({ page }, run) => {
    await login(page);
    await run(page);
  }
});

export const gotoSection = async (page: Page, url: string) => {
  await page.goto(url);
  await page.locator("#page-header-title").waitFor({ state: "visible", timeout: 15000 });
};

export const screensTest = sectionTest("/screens");
export const playlistsTest = sectionTest("/playlists");
export const calendarTest = sectionTest("/calendar");
export const providersTest = sectionTest("/providers");

export { expect } from "@playwright/test";
