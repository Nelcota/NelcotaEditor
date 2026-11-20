import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { preferencesSchema } from "#/modules/preferences/preferences";
import type { Preferences } from "#/modules/preferences/preferences";
import { userPreferences } from "#/modules/preferences/preferences.schema";
import { findPreferences } from "#/modules/preferences/server/find-preferences.server";

export const getPreferences = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<Preferences> => findPreferences(context.user.id));

export const savePreferences = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(preferencesSchema)
    .handler(async ({ context, data }): Promise<Preferences> => {
        await db
            .insert(userPreferences)
            .values({ userId: context.user.id, ...data })
            .onConflictDoUpdate({ target: userPreferences.userId, set: data });

        return data;
    });
