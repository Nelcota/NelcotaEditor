import type { ReactNode } from "react";
import { useVideoProgressWatch } from "#/modules/videos/ui/hooks/use-video-progress-watch";

/**
 * Keeps the video lists and counts in the cache current while any video is processing, on every
 * page: the sidebar badges and counts read that cache. Renders nothing.
 */
export function VideoProgressWatcher(): ReactNode {
    useVideoProgressWatch();

    return null;
}
