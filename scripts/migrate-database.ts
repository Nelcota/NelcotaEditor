import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { PgBoss } from "pg-boss";
import { z } from "zod";

/**
 * Production migration step. The owner role applies the schema; the web server and the worker
 * connect as a role that can only read and write rows, so a bug or an injection there cannot
 * drop or alter a table.
 */

const MIGRATIONS_FOLDER = "./drizzle";
const JOB_QUEUE_SCHEMA = "pgboss";
const ROLE_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/;
const MIN_PASSWORD_LENGTH = 24;

const environmentSchema = z.object({
    MIGRATION_DATABASE_URL: z.string().trim().min(1),
    APP_DATABASE_USER: z.string().trim().regex(ROLE_NAME_PATTERN),
    APP_DATABASE_PASSWORD: z.string().min(MIN_PASSWORD_LENGTH),
});

type MigrationEnvironment = z.infer<typeof environmentSchema>;

function readEnvironment(): MigrationEnvironment {
    const result = environmentSchema.safeParse(process.env);

    if (result.success === false) {
        const variableNames = result.error.issues.map((issue) => issue.path.join("."));
        throw new Error(`Invalid or missing environment variables: ${variableNames.join(", ")}`);
    }

    return result.data;
}

/** Installs or upgrades pg-boss's tables now, so the app role never needs to create them. */
async function installJobQueueSchema(connectionString: string): Promise<void> {
    const jobQueue = new PgBoss({ connectionString, supervise: false, schedule: false });
    await jobQueue.start();
    await jobQueue.stop({ graceful: false });
}

/** Creates the app role, or resets its password so the deploy settings stay the source of truth. */
async function upsertAppRole(client: Client, environment: MigrationEnvironment): Promise<void> {
    const roleName = client.escapeIdentifier(environment.APP_DATABASE_USER);
    const password = client.escapeLiteral(environment.APP_DATABASE_PASSWORD);
    const existing = await client.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [
        environment.APP_DATABASE_USER,
    ]);

    if (existing.rowCount === 0) {
        await client.query(`CREATE ROLE ${roleName} LOGIN PASSWORD ${password}`);
        return;
    }

    await client.query(`ALTER ROLE ${roleName} LOGIN PASSWORD ${password}`);
}

/** Rows only: no CREATE, ALTER or DROP on any schema. Re-run on every deploy for new tables. */
async function grantRowAccess(client: Client, roleName: string): Promise<void> {
    const databaseName = client.database;

    if (databaseName === undefined) {
        throw new Error("MIGRATION_DATABASE_URL names no database");
    }

    const role = client.escapeIdentifier(roleName);
    const database = client.escapeIdentifier(databaseName);
    const schemas = `public, ${client.escapeIdentifier(JOB_QUEUE_SCHEMA)}`;

    await client.query(`GRANT CONNECT ON DATABASE ${database} TO ${role}`);
    await client.query(`GRANT USAGE ON SCHEMA ${schemas} TO ${role}`);
    await client.query(
        `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schemas} TO ${role}`,
    );
    await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${schemas} TO ${role}`);
    await client.query(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ${schemas} TO ${role}`);
}

async function migrateDatabase(): Promise<void> {
    const environment = readEnvironment();
    const client = new Client({ connectionString: environment.MIGRATION_DATABASE_URL });
    await client.connect();

    try {
        await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
        console.log("Drizzle migrations applied");
        await installJobQueueSchema(environment.MIGRATION_DATABASE_URL);
        console.log("Job queue schema ready");
        await upsertAppRole(client, environment);
        await grantRowAccess(client, environment.APP_DATABASE_USER);
        // A fixed line: the settings object also holds the passwords.
        console.log("App role can read and write rows");
    } finally {
        await client.end();
    }
}

await migrateDatabase();
