import type { QueryClient } from "@tanstack/react-query";
import { isNotFound, notFound } from "@tanstack/react-router";
import { adminUserQueryOptions } from "#/modules/admin/model/admin-queries";
import { adminUserIdInputSchema } from "#/modules/admin/model/admin-search";

/**
 * Loads the account into the cache, so the page opens with it. An id no account can have, or an
 * account that is gone, becomes the 404 page; any other failure is left to the screen, which shows
 * its own message and a way to try again.
 */
export async function loadAdminUser(queryClient: QueryClient, userId: string): Promise<void> {
    if (adminUserIdInputSchema.safeParse({ userId }).success === false) {
        throw notFound();
    }

    try {
        await queryClient.ensureQueryData(adminUserQueryOptions(userId));
    } catch (error) {
        // Any other failure stays on the query, where the screen reads it.
        if (isNotFound(error) === true) {
            throw error;
        }
    }
}
