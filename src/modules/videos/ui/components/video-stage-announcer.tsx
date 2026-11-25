import type { ReactNode } from "react";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { useStageAnnouncement } from "#/modules/videos/ui/hooks/use-stage-announcement";

/**
 * Says each new stage, completion included, once. It stays mounted after the processing panel
 * leaves, so "Pronto" is still heard; the panel itself is not live, or every poll would re-read it.
 */
export function VideoStageAnnouncer({ video }: { video: VideoSummary }): ReactNode {
    const announcement = useStageAnnouncement([video]);

    return (
        <p role="status" className="sr-only">
            {announcement}
        </p>
    );
}
