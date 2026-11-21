import type { ReactNode } from "react";
import type { VideoSummary } from "#/modules/videos/video-views";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";

const FRAME_CLASS = "relative aspect-video w-full overflow-hidden rounded-2xl border bg-black";

/** Shown when there is nothing to play yet, or the browser cannot play this file's format. */
export function OriginalUnavailable({
    video,
    message,
}: {
    video: VideoSummary;
    message: string;
}): ReactNode {
    const thumbnailUrl = video.thumbnailUrl;

    return (
        <div className={FRAME_CLASS}>
            {thumbnailUrl !== null && (
                <img
                    src={thumbnailUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 size-full object-cover opacity-40"
                />
            )}
            <div className="absolute inset-0 grid content-center justify-items-center gap-2 p-6 text-center text-sm font-semibold text-white">
                {thumbnailUrl === null && <VideoMascot videoId={video.id} className="size-14" />}
                {thumbnailUrl !== null && <StageCrewMascot status="queued" className="size-12" />}
                <p className="max-w-sm">{message}</p>
            </div>
        </div>
    );
}
