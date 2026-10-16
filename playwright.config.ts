import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, "tests", ".auth-state.json");

const baseURL = process.env.BASE_URL || "http://localhost:3105";
const apiBase = process.env.API_BASE || "http://localhost:8084";
const messagingSocket = process.env.REACT_APP_MESSAGING_API_SOCKET || "ws://localhost:8087";

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 2 : 4,
  reporter: "list",
  timeout: 60 * 1000,
  expect: { timeout: 5 * 1000 },

  globalSetup: "./tests/global-setup.ts",

  use: {
    baseURL,
    storageState: STORAGE_STATE_PATH,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000
  },

  webServer: [
    {
      command: "npm --prefix ../Api run dev",
      url: `${apiBase}/health`,
      reuseExistingServer: true,
      timeout: 60 * 1000,
      stdout: "pipe",
      stderr: "pipe"
    },
    {
      command: "yarn start",
      env: {
        PORT: new URL(baseURL).port || "3105",
        REACT_APP_STAGE: "dev",
        REACT_APP_API_BASE: apiBase,
        REACT_APP_MESSAGING_API_SOCKET: messagingSocket
      },
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120 * 1000
    }
  ],

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: true
      },
      fullyParallel: true
    }
  ]
});
