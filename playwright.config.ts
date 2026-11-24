import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const TEST_ENV_FILE = ".env.test";
const E2E_PORT = 3299;
const BASE_URL = `http://localhost:${E2E_PORT}`;
const SERVER_START_TIMEOUT_MILLISECONDS = 120_000;

if (existsSync(TEST_ENV_FILE) === false) {
    throw new Error(`${TEST_ENV_FILE} is missing. Run \`bun run setup\` first.`);
}

// The app under test reads the test database and has Turnstile off; see prepare-test-database.ts.
process.loadEnvFile(TEST_ENV_FILE);

export default defineConfig({
    testDir: "e2e",
    forbidOnly: process.env.CI !== undefined,
    reporter: "list",
    // Reduced motion: the app's animations honour it, and axe then measures settled colours instead
    // of a dialog halfway through fading in.
    use: {
        baseURL: BASE_URL,
        trace: "retain-on-failure",
        contextOptions: { reducedMotion: "reduce" },
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: `bunx --bun vite dev --port ${E2E_PORT} --strictPort`,
        url: `${BASE_URL}/sign-in`,
        reuseExistingServer: process.env.CI === undefined,
        timeout: SERVER_START_TIMEOUT_MILLISECONDS,
    },
});
