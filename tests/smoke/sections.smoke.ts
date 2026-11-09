import { test, expect, openAndLoad } from "./fixtures";

// One read-only visit per section. The API path is the request that proves the
// section loaded its own data, not just the app shell.
const SECTIONS = [
  { name: "Screens", path: "/screens", api: /\/doing\/screens$/ },
  { name: "Playlists", path: "/playlists", api: /\/doing\/playlists$/ },
  { name: "Calendar", path: "/calendar", api: /\/doing\/scheduleEntries$/ },
  { name: "Providers", path: "/providers", api: /\/doing\/contentProviderAuths\/church$/ }
];

for (const s of SECTIONS) {
  test(`${s.name} loads`, async ({ page }) => {
    await openAndLoad(page, s.path, s.api);
    await expect(page).toHaveURL(new RegExp(s.path));
  });
}
