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
    expiresAt: z.union([z.date(), z.iso.datetime({ offset: true }).pipe(z.coerce.date())]),
});

/**
 * Better Auth renews a session on use unless the "don't remember me" cookie is present, and an
 * admin visiting a customer's account can drop that cookie to stretch the 1 hour visit to 7 days.
 * A visit keeps the expiry it was created with; every other session refreshes as usual.
 */
export async function keepImpersonatedSessionExpiry(
    update: SessionUpdate,
    endpointContext: SessionRefreshContext | null,
): Promise<{ data: SessionUpdate } | false | undefined> {
    if (update.expiresAt === undefined || endpointContext === null) {
        return undefined;
    }

    const currentSession = endpointContext.context.session;

    if (currentSession === null) {
        return undefined;
    }

    const session = currentSession.session;
    const impersonatedBy = session.impersonatedBy;

    if (impersonatedBy === null || impersonatedBy === undefined) {
        return undefined;
    }

    const result = impersonatedSessionSchema.safeParse(session);

    if (result.success === false) {
        return false;
    }

    return { data: { ...update, expiresAt: result.data.expiresAt } };
}
