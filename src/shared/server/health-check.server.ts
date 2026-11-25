import { sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { toHealthResponse } from "#/shared/server/health-response";
import type { HealthStatus } from "#/shared/server/health-response";
import { logger } from "#/shared/server/logger.server";

/** The server answers and the database takes a query. */
export async function checkHealth(): Promise<HealthStatus> {
    try {
        await db.execute(sql`select 1`);
        return "ok";
    } catch (error) {
        logger.error({ error }, "Health check could not reach the database");
        return "unavailable";
    }
}

export async function respondWithHealth(): Promise<Response> {
    return toHealthResponse(await checkHealth());
}
