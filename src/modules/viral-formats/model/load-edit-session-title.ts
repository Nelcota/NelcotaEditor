import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { editSessionQueryOptions } from "#/modules/viral-formats/model/edit-session-queries";

const sessionIdSchema = z.uuid();

/**
 * Loads the batch into the cache (so the page opens with it) and returns its title for the tab.
 * A malformed id, a missing batch and another person's all become the 404 page.
 */
export async function loadEditSessionTitle(
    queryClient: QueryClient,
    sessionId: string,
): Promise<string> {
    // Checked here so a typo in the address answers 404 instead of failing the server's validator.
    if (sessionIdSchema.safeParse(sessionId).success === false) {
        throw notFound();
    }

    const session = await queryClient.ensureQueryData(editSessionQueryOptions(sessionId));

    if (session === null) {
        throw notFound();
    }

    return session.title;
}
