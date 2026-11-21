import { z } from "zod";

export const MAX_VIDEO_TITLE_LENGTH = 200;
// yt-dlp prints this literal when a field is missing from the video's metadata.
const MISSING_FIELD_PLACEHOLDER = "NA";

/** Shared by the rename form and the server, which validates it again. */
export const videoTitleSchema = z
    .string()
    .trim()
    .min(1, "Digite um título.")
    // Counted in code points, like truncateText and the database's char_length CHECK: a stored
    // title with emojis must still pass when the form saves it back.
    .refine((title) => Array.from(title).length <= MAX_VIDEO_TITLE_LENGTH, {
        message: `O título pode ter até ${MAX_VIDEO_TITLE_LENGTH} caracteres.`,
    });

export const renameVideoFormSchema = z.object({ title: videoTitleSchema });

/** Cuts by code points, so an emoji at the edge is dropped whole instead of split in half. */
export function truncateText(text: string, maxLength: number): string {
    return Array.from(text).slice(0, maxLength).join("").trim();
}

/**
 * A title from an outside source (yt-dlp, YouTube) made safe to store: null when there is none,
 * and never longer than the rename form accepts, so the form can always save it back.
 */
export function toStoredVideoTitle(externalTitle: string): string | null {
    const trimmed = externalTitle.trim();

    if (trimmed.length === 0 || trimmed === MISSING_FIELD_PLACEHOLDER) {
        return null;
    }

    return truncateText(trimmed, MAX_VIDEO_TITLE_LENGTH);
}
