const HASH_MULTIPLIER = 31;

/**
 * Videos use the "shapes" 0–14. Shape 15 (the green ghost) is the brand mark and the 16
 * "objects" are the crew of each processing stage, so one drawing never has two meanings.
 */
export const VIDEO_MASCOT_COUNT = 15;

/** A video keeps the same mascot for life, so it is derived from the id instead of stored. */
export function toVideoMascotIndex(videoId: string): number {
    if (videoId.trim().length === 0) {
        throw new Error("A video id is required to pick its mascot.");
    }

    let hash = 0;

    for (const character of videoId) {
        // `>>> 0` keeps the hash an unsigned 32-bit integer so it never loses precision.
        hash = (hash * HASH_MULTIPLIER + character.charCodeAt(0)) >>> 0;
    }

    return hash % VIDEO_MASCOT_COUNT;
}
