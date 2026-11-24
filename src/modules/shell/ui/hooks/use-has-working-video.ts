import { useWorkingVideoCount } from "#/modules/shell/ui/hooks/use-working-video-count";

/**
 * True while any video is still being cut (queued or at work); the Vídeos tab then shows a small
 * dot. It counts the same videos as the desktop bell, so phone and desktop agree.
 */
export function useHasWorkingVideo(): boolean {
    return useWorkingVideoCount() > 0;
}
