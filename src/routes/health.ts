import { createFileRoute } from "@tanstack/react-router";
import { respondWithHealth } from "#/shared/server/health-check.server";

// Outside the signed-in layout and GET only: Docker polls it with no session, and the origin check
// in src/start.ts covers only server functions and methods that change state.
export const Route = createFileRoute("/health")({
    server: {
        handlers: {
            GET: () => respondWithHealth(),
        },
    },
});
