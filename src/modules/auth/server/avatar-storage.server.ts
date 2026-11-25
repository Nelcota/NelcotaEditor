import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { AVATAR_PHOTO_EXTENSIONS } from "#/modules/auth/model/avatar";
import type { AvatarPhotoExtension } from "#/modules/auth/model/avatar";
import { user } from "#/modules/auth/auth.schema";
import { OWNER_LINK_LIFETIME_SECONDS } from "#/shared/server/file-storage/file-storage";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";

const AVATAR_DIRECTORY = "avatars";

function toAvatarKey(userId: string, extension: AvatarPhotoExtension): string {
    return path.posix.join(AVATAR_DIRECTORY, `${userId}.${extension}`);
}

/** Removes every stored photo of the user, whatever its format. */
export async function deleteAvatarPhotos(userId: string): Promise<void> {
    const storage = getFileStorage();

    await Promise.all(
        AVATAR_PHOTO_EXTENSIONS.map((extension) =>
            storage.deleteFile(toAvatarKey(userId, extension)),
        ),
    );
}

export async function writeAvatarPhoto(
    userId: string,
    extension: AvatarPhotoExtension,
    bytes: Uint8Array,
): Promise<void> {
    // Blob takes only bytes backed by a plain ArrayBuffer; a photo is small enough to copy.
    const photo = new Blob([new Uint8Array(bytes)]);

    await deleteAvatarPhotos(userId);
    await getFileStorage().storeStream(toAvatarKey(userId, extension), photo.stream());
}

interface AvatarPhoto {
    userId: string;
    extension: AvatarPhotoExtension;
    shouldProxy: boolean;
}

/** 404 when the row briefly points at a photo that a newer upload already replaced. */
export function respondWithAvatarPhoto(
    request: Request,
    photo: AvatarPhoto,
    headers: Headers,
): Promise<Response> {
    return getFileStorage().respondWithFile(request, {
        key: toAvatarKey(photo.userId, photo.extension),
        headers,
        linkLifetimeSeconds: OWNER_LINK_LIFETIME_SECONDS,
        shouldProxy: photo.shouldProxy,
    });
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
