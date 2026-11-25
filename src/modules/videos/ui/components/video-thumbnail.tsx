import { useState } from "react";
import type { ReactNode } from "react";
import { VideoMascot } from "#/modules/videos/ui/components/video-mascot";
import type { VideoSummary } from "#/modules/videos/model/video-views";

/** A frame of the video when there is one; its mascot on a sunken field otherwise. */
export function VideoThumbnail({ video }: { video: VideoSummary }): ReactNode {
    const thumbnailUrl = video.thumbnailUrl;
    // A frame that fails to load (deleted file, blocked host) falls back to the mascot too.
    const [hasFailed, setHasFailed] = useState(false);

    if (thumbnailUrl === null || hasFailed === true) {
        return (
            <span className="grid h-10 w-16 shrink-0 place-items-center rounded-lg bg-secondary">
                <VideoMascot videoId={video.id} className="size-6" />
            </span>
        );
    }

    return (
        <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setHasFailed(true)}
            className="h-10 w-16 shrink-0 rounded-lg bg-secondary object-cover outline-1 -outline-offset-1 outline-foreground/10 outline-solid"
        />
    );
}
