import { readFile, rm, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { AVATAR_PHOTO_EXTENSIONS } from "#/modules/auth/avatar";
import type { AvatarPhotoExtension } from "#/modules/auth/avatar";
import { user } from "#/modules/auth/auth.schema";
import { resolveStoragePath } from "#/shared/server/storage.server";

const AVATAR_DIRECTORY = "avatars";

function toAvatarPath(userId: string, extension: AvatarPhotoExtension): string {
    return resolveStoragePath(path.posix.join(AVATAR_DIRECTORY, `${userId}.${extension}`));
}

/** Removes every stored photo of the user, whatever its format. */
export async function deleteAvatarPhotos(userId: string): Promise<void> {
    await Promise.all(
        AVATAR_PHOTO_EXTENSIONS.map((extension) =>
            rm(toAvatarPath(userId, extension), { force: true }),
        ),
    );
}

export async function writeAvatarPhoto(
    userId: string,
    extension: AvatarPhotoExtension,
    bytes: Uint8Array,
): Promise<void> {
    await mkdir(resolveStoragePath(AVATAR_DIRECTORY), { recursive: true });
    await deleteAvatarPhotos(userId);
    await writeFile(toAvatarPath(userId, extension), bytes);
}

export async function readAvatarPhoto(
    userId: string,
    extension: AvatarPhotoExtension,
): Promise<Buffer> {
    return readFile(toAvatarPath(userId, extension));
}

export async function saveUserImage(userId: string, image: string | null): Promise<void> {
    await db.update(user).set({ image }).where(eq(user.id, userId));
}

export async function findUserImage(userId: string): Promise<string | null> {
    const rows = await db
        .select({ image: user.image })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
    const row = rows[0];

    if (row === undefined) {
        return null;
    }

    return row.image;
}
