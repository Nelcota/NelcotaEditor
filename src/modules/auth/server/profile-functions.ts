import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { profileNameSchema } from "#/modules/auth/auth-forms.schema";
import { user } from "#/modules/auth/auth.schema";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";

/** Only the name: the e-mail is how the person signs in, so it stays as it is. */
export const renameUser = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(profileNameSchema)
    .handler(async ({ context, data }): Promise<void> => {
        await db
            .update(user)
            .set({ name: data.name, updatedAt: new Date() })
            .where(eq(user.id, context.user.id));
    });
