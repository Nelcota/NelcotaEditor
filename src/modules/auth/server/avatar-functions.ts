import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AVATAR_MASCOT_COUNT, toMascotImage } from "#/modules/auth/model/avatar";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { deleteAvatarPhotos, saveUserImage } from "#/modules/auth/server/avatar-storage.server";

const mascotInputSchema = z.object({
    index: z
        .number()
        .int()
        .min(0)
        .max(AVATAR_MASCOT_COUNT - 1),
});

export const chooseAvatarMascot = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(mascotInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const userId = context.user.id;
        // The row stops pointing at the photo before the file goes, so it never points at nothing.
        await saveUserImage(userId, toMascotImage(data.index));
        await deleteAvatarPhotos(userId);
    });

/** Back to initials: the photo file is deleted too, not just unlinked. */
export const removeAvatar = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<void> => {
        const userId = context.user.id;
        await saveUserImage(userId, null);
        await deleteAvatarPhotos(userId);
    });
