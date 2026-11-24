import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env", quiet: true });

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined) {
    throw new Error("DATABASE_URL is missing. Run `bun run setup` first.");
}

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: databaseUrl,
    },
});
