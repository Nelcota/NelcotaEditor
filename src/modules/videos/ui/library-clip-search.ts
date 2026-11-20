import type { LibraryClip } from "#/modules/videos/video-views";
import { normalizeForSearch } from "#/shared/ui/normalize-for-search";

/** A clip matches by its own title or by the title of the video it came from. */
function matchesQuery(item: LibraryClip, normalizedQuery: string): boolean {
    const clip = item.clip;

    return (
        normalizeForSearch(clip.title).includes(normalizedQuery) ||
        normalizeForSearch(item.videoTitle).includes(normalizedQuery)
    );
}

export function searchLibraryClips(items: Array<LibraryClip>, query: string): Array<LibraryClip> {
    const normalizedQuery = normalizeForSearch(query);

    if (normalizedQuery.length === 0) {
        return items;
    }

    return items.filter((item) => matchesQuery(item, normalizedQuery));
}
