import { z } from "zod";

interface SessionUpdate {
    expiresAt?: Date;
}

/** The part of Better Auth's endpoint context this hook reads: the session being refreshed. */
interface SessionRefreshContext {
    context: {
        session: { session: Record<string, unknown> } | null;
    };
}

const impersonatedSessionSchema = z.object({
    impersonatedBy: z.string().min(1),
    expiresAt: z.coerce.date(),
});

/**
 * Better Auth renews a session on use unless the "don't remember me" cookie is present, and an
 * admin visiting a customer's account can drop that cookie to stretch the 1 hour visit to 7 days.
 * A visit keeps the expiry it was created with; every other session refreshes as usual.
 */
export async function keepImpersonatedSessionExpiry(
    update: SessionUpdate,
    endpointContext: SessionRefreshContext | null,
): Promise<{ data: SessionUpdate } | undefined> {
    if (update.expiresAt === undefined || endpointContext === null) {
        return undefined;
    }

    const currentSession = endpointContext.context.session;

    if (currentSession === null) {
        return undefined;
    }

    const result = impersonatedSessionSchema.safeParse(currentSession.session);

    if (result.success === false) {
        return undefined;
    }

    return { data: { ...update, expiresAt: result.data.expiresAt } };
}
