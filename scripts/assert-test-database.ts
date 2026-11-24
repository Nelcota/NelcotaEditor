// Vitest setup for the integration project. Its environment comes from .env.test, but Vite also
// reads .env, so a missing .env.test would leave the development DATABASE_URL in place and the
// tests would write to it. Stop before any test connects.
const TEST_DATABASE_SUFFIX = "/nelcota_test";

const databaseUrl = process.env.DATABASE_URL ?? "";

if (databaseUrl.endsWith(TEST_DATABASE_SUFFIX) === false) {
    throw new Error(
        `Integration tests only run against the ${TEST_DATABASE_SUFFIX.slice(1)} database. Run \`bun run setup\` to create .env.test.`,
    );
}
