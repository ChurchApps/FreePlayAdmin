# Tests

| Tier | When | Command |
|---|---|---|
| Smoke | Every PR and push to main (`.github/workflows/smoke.yml`) | see below |
| PR | Before pushing a PR branch | `yarn test` (the suite is small enough to run whole) |
| Full | Nightly | `yarn test` |

**Smoke** (`tests/smoke/`, `playwright.smoke.config.ts`) only reads. It opens Screens, Playlists, Calendar and Providers as the demo user, waits for each page's data request, and fails on any uncaught page error or a 5xx from our API. FreePlayAdmin has no demo site, so `smoke.yml` builds the app against the demo API, serves the build, and runs the suite against it. Smoke never runs against production: `playwright.smoke.config.ts` refuses any host that is not a demo or local host.

The same thing by hand:

```bash
REACT_APP_STAGE=demo REACT_APP_API_BASE=https://api.demo.churchapps.org yarn vite build
yarn vite preview --port 4105 &
SMOKE_BASE_URL=http://localhost:4105 SMOKE_EMAIL=demo@b1.church SMOKE_PASSWORD=password SMOKE_CHURCH="Grace Community Church" yarn test:smoke
```
