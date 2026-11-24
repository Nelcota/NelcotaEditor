import * as schema from "#/db/schema";
import { getEnvironment } from "#/shared/server/env.server";
import { drizzle } from "drizzle-orm/node-postgres";

const environment = getEnvironment();

export const db = drizzle(environment.DATABASE_URL, { schema });
