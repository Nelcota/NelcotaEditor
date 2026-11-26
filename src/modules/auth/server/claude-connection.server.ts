import { and, eq, min } from "drizzle-orm";
import { db } from "#/db/database.server";
import { oauthAccessToken, oauthConsent, oauthRefreshToken } from "#/modules/auth/auth.schema";

/**
 * When the person first let a Claude in, or null when none is. Consent is stored the moment the
 * person approves on the consent page, so it marks the connection even before the first call.
 */
export async function findClaudeConnectedAt(userId: string): Promise<Date | null> {
    const rows = await db
        .select({ connectedAt: min(oauthConsent.createdAt) })
        .from(oauthConsent)
        .where(eq(oauthConsent.userId, userId));

    return rows[0]?.connectedAt ?? null;
}

/**
 * Whether the person still lets this client in. Access tokens are JWTs checked without the
 * database, so /api/mcp asks this on every call: disconnecting then takes effect at once instead
 * of when the token expires.
 */
export async function hasClaudeConsent(userId: string, clientId: string): Promise<boolean> {
    const rows = await db
        .select({ id: oauthConsent.id })
        .from(oauthConsent)
        .where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)))
        .limit(1);

    return rows.length > 0;
}

/**
 * Cuts every Claude off the person's account at once: its tokens stop working on the next call,
 * and connecting again asks for consent again.
 */
export async function disconnectClaude(userId: string): Promise<void> {
    await db.transaction(async (transaction) => {
        await transaction.delete(oauthAccessToken).where(eq(oauthAccessToken.userId, userId));
        await transaction.delete(oauthRefreshToken).where(eq(oauthRefreshToken.userId, userId));
        await transaction.delete(oauthConsent).where(eq(oauthConsent.userId, userId));
    });
}
