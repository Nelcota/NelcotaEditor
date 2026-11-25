import { writeFileSync } from "node:fs";
import { execa } from "execa";
import { EXTERNAL_SERVICES_OFF, TEST_ENV_FILE } from "./test-environment";

// Tests write and delete rows freely, so they get their own database in the same container and
// never touch the one the app uses. The values are local and hold no secret.
const TEST_DATABASE = "nelcota_test";
const DATABASE_USER = "nelcota";
const TEST_DATABASE_URL = `postgresql://${DATABASE_USER}:nelcota@127.0.0.1:5436/${TEST_DATABASE}`;
// The end-to-end app runs on its own port.
const E2E_APP_URL = "http://localhost:3299";
const TEST_ENV_LINES = [
    "# Written by scripts/prepare-test-database.ts; edits are replaced on the next run.",
    `DATABASE_URL=${TEST_DATABASE_URL}`,
    `BETTER_AUTH_URL=${E2E_APP_URL}`,
    "BETTER_AUTH_SECRET=test-only-secret-never-used-outside-local-tests",
    // Each end-to-end test sends its own address here, so the sign-up limit counts per test.
    "TRUSTED_PROXY_IP_HEADER=x-real-ip",
    "STORAGE_DIR=storage-test",
    "WHISPER_URL=http://127.0.0.1:1",
    "WHISPER_MODEL=test-model",
    ...Object.entries(EXTERNAL_SERVICES_OFF).map(([name, value]) => `${name}=${value}`),
];

function writeTestEnvFile(): void {
    writeFileSync(TEST_ENV_FILE, `${TEST_ENV_LINES.join("\n")}\n`);
}

async function runInDatabaseContainer(args: Array<string>): Promise<string> {
    const result = await execa("docker", ["compose", "exec", "-T", "postgres", ...args]);

    return result.stdout.trim();
}

async function createTestDatabase(): Promise<void> {
    const existing = await runInDatabaseContainer([
        "psql",
        "-U",
        DATABASE_USER,
        "-d",
        DATABASE_USER,
        "-tAc",
        `select 1 from pg_database where datname = '${TEST_DATABASE}'`,
    ]);

    if (existing === "1") {
        return;
    }

    console.info(`\n> Creating the ${TEST_DATABASE} database`);
    await runInDatabaseContainer(["createdb", "-U", DATABASE_USER, TEST_DATABASE]);
}

/** The test database exists and has every migration; safe to run again. Needs Postgres up. */
export async function prepareTestDatabase(): Promise<void> {
    writeTestEnvFile();
    await createTestDatabase();
    console.info("\n> Applying migrations to the test database");
    await execa("bunx", ["drizzle-kit", "migrate"], {
        stdio: "inherit",
        env: { DATABASE_URL: TEST_DATABASE_URL },
    });
}
