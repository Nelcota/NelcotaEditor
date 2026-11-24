import * as schema from "#/db/schema";
import { getEnvironment } from "#/shared/server/env.server";
import { drizzle } from "drizzle-orm/node-postgres";

const environment = getEnvironment();

// node-postgres waits forever by default. A connection that dies without a reset (Docker network,
// a sleeping host) then hangs every query on it, and the worker leaves the video stuck in its
// stage with no error. These limits turn that into an error the pipeline records.
const CONNECT_TIMEOUT_MILLISECONDS = 10_000;
const STATEMENT_TIMEOUT_MILLISECONDS = 30_000;
// Client side, a little above the server limit: it also fires when the server never answers.
const QUERY_TIMEOUT_MILLISECONDS = 35_000;
const IDLE_IN_TRANSACTION_TIMEOUT_MILLISECONDS = 60_000;

export const db = drizzle({
    connection: {
        connectionString: environment.DATABASE_URL,
        connectionTimeoutMillis: CONNECT_TIMEOUT_MILLISECONDS,
        statement_timeout: STATEMENT_TIMEOUT_MILLISECONDS,
        query_timeout: QUERY_TIMEOUT_MILLISECONDS,
        idle_in_transaction_session_timeout: IDLE_IN_TRANSACTION_TIMEOUT_MILLISECONDS,
        keepAlive: true,
    },
    schema,
});
