import type { AvatarPhotoExtension } from "#/modules/auth/avatar";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const WEBP_SIGNATURE_OFFSET = 8;

export const AVATAR_CONTENT_TYPES: Record<AvatarPhotoExtension, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    webp: "image/webp",
};

function startsWith(bytes: Uint8Array, signature: Array<number>, offset: number): boolean {
    return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * Identifies the photo by its first bytes, never by the name or Content-Type the client sent.
 * Only PNG, JPEG and WebP pass: SVG could carry scripts.
 */
export function detectAvatarFormat(bytes: Uint8Array): AvatarPhotoExtension | null {
    if (startsWith(bytes, PNG_SIGNATURE, 0) === true) {
        return "png";
    }

    if (startsWith(bytes, JPEG_SIGNATURE, 0) === true) {
        return "jpg";
    }

    if (
        startsWith(bytes, RIFF_SIGNATURE, 0) === true &&
        startsWith(bytes, WEBP_SIGNATURE, WEBP_SIGNATURE_OFFSET) === true
    ) {
        return "webp";
    }

    return null;
}
