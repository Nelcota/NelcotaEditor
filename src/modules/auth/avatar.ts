/**
 * What `user.image` holds, decoded for the UI:
 * - "mascot:<index>"           → one of the video "shapes" mascots;
 * - "photo:<extension>:<time>" → an uploaded photo, served by /api/account/avatar;
 * - anything else (or null)    → the user's initials.
 */
export type Avatar =
    | { kind: "initials" }
    | { kind: "mascot"; index: number }
    | { kind: "photo"; url: string };

export const AVATAR_MASCOT_COUNT = 15;
const BYTES_PER_MEGABYTE = 1024 * 1024;
export const MAX_AVATAR_MEGABYTES = 2;
export const MAX_AVATAR_BYTES = MAX_AVATAR_MEGABYTES * BYTES_PER_MEGABYTE;
export const AVATAR_TOO_LARGE_MESSAGE = `A foto passa do limite de ${MAX_AVATAR_MEGABYTES} MB.`;
export const AVATAR_PHOTO_EXTENSIONS = ["png", "jpg", "webp"] as const;

export type AvatarPhotoExtension = (typeof AVATAR_PHOTO_EXTENSIONS)[number];

const MASCOT_PATTERN = /^mascot:(\d{1,2})$/;
const PHOTO_PATTERN = /^photo:(png|jpg|webp):(\d+)$/;

export function toMascotImage(index: number): string {
    return `mascot:${index}`;
}

export function toPhotoImage(extension: AvatarPhotoExtension, version: number): string {
    return `photo:${extension}:${version}`;
}

export function readPhotoExtension(image: string | null): AvatarPhotoExtension | null {
    const match = PHOTO_PATTERN.exec(image ?? "");
    const extension = AVATAR_PHOTO_EXTENSIONS.find((candidate) => candidate === match?.[1]);

    return extension ?? null;
}

export function toAvatar(image: string | null): Avatar {
    const value = image ?? "";
    const mascotMatch = MASCOT_PATTERN.exec(value);

    if (mascotMatch !== null) {
        const index = Number(mascotMatch[1]);

        if (index < AVATAR_MASCOT_COUNT) {
            return { kind: "mascot", index };
        }
    }

    const photoMatch = PHOTO_PATTERN.exec(value);

    if (photoMatch !== null) {
        // The version busts the browser cache whenever a new photo is uploaded.
        return { kind: "photo", url: `/api/account/avatar?v=${photoMatch[2]}` };
    }

    return { kind: "initials" };
}
