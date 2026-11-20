import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "#/db/schema";
import { getEnvironment } from "#/shared/server/env.server";

const environment = getEnvironment();

export const db = drizzle(environment.DATABASE_URL, { schema });
