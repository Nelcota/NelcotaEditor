import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { DEFAULT_PREFERENCES, preferencesSchema } from "#/modules/preferences/model/preferences";
import type { Preferences } from "#/modules/preferences/model/preferences";
import { userPreferences } from "#/modules/preferences/preferences.schema";
import { logger } from "#/shared/server/logger.server";

/** The user's saved preferences, or the defaults when nothing was saved (or the row is invalid). */
export async function findPreferences(userId: string): Promise<Preferences> {
    if (userId.trim().length === 0) {
        throw new RangeError("Cannot load preferences without a user id");
    }

    const rows = await db
        .select({
            defaultClipCount: userPreferences.defaultClipCount,
            defaultClipLength: userPreferences.defaultClipLength,
            transcriptionLanguage: userPreferences.transcriptionLanguage,
        })
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);
    const savedRow = rows[0];

    if (savedRow === undefined) {
        return DEFAULT_PREFERENCES;
    }

    // The columns are plain text/integer, so an old or hand-edited row may hold values the
    // app no longer offers; fall back to the defaults, but leave a trace instead of hiding it.
    const result = preferencesSchema.safeParse(savedRow);

    if (result.success === false) {
        logger.warn({ userId, issues: result.error.issues }, "Ignoring invalid saved preferences");
        return DEFAULT_PREFERENCES;
    }

    return result.data;
}
