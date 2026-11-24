import type { ReactNode } from "react";
import { useVideosQuery } from "#/modules/videos/ui/hooks/use-videos-query";

/**
 * Keeps the video list in the cache current while any video is processing, on every page: the
 * sidebar badges and counts read that cache. Renders nothing.
 */
export function VideoProgressWatcher(): ReactNode {
    useVideosQuery();

    return null;
}
