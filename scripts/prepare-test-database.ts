import { existsSync, writeFileSync } from "node:fs";
import { execa } from "execa";

// Tests write and delete rows freely, so they get their own database in the same container and
// never touch the one the app uses. The values are local and hold no secret.
const TEST_ENV_FILE = ".env.test";
const TEST_DATABASE = "nelcota_test";
const DATABASE_USER = "nelcota";
const TEST_DATABASE_URL = `postgresql://${DATABASE_USER}:nelcota@127.0.0.1:5436/${TEST_DATABASE}`;
const TEST_ENV_LINES = [
    "# Written by scripts/prepare-test-database.ts for bun run test:integration.",
    `DATABASE_URL=${TEST_DATABASE_URL}`,
    "STORAGE_DIR=storage-test",
    "WHISPER_URL=http://127.0.0.1:1",
    "WHISPER_MODEL=test-model",
];

function writeTestEnvFile(): void {
    if (existsSync(TEST_ENV_FILE) === true) {
        return;
    }

    writeFileSync(TEST_ENV_FILE, `${TEST_ENV_LINES.join("\n")}\n`);
    console.info(`\n> Created ${TEST_ENV_FILE}`);
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
