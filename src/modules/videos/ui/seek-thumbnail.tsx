import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { formatClock } from "#/shared/ui/format";

// Hovering moves the pointer many times a second; asking for a frame every 2 seconds of video is
// enough to recognise the scene and keeps the requests to the server few.
const FRAME_STEP_SECONDS = 2;

interface SeekThumbnailProps {
    fileUrl: string;
    seconds: number;
    /** The clip's number when the pointer is over one. */
    clipRank: number | null;
}

/** The frame and the time under the pointer, so you can find a scene without playing to it. */
export function SeekThumbnail({ fileUrl, seconds, clipRank }: SeekThumbnailProps): ReactNode {
    const videoRef = useRef<HTMLVideoElement>(null);
    const frameSeconds = Math.floor(seconds / FRAME_STEP_SECONDS) * FRAME_STEP_SECONDS;

    useEffect(() => {
        const video = videoRef.current;

        // In a narrow player the frame is hidden by a container query; a hidden video still
        // downloads, so the source is only attached when the frame actually shows.
        if (video === null || video.getClientRects().length === 0) {
            return;
        }

        if (video.getAttribute("src") === null) {
            video.src = fileUrl;
        }

        video.currentTime = frameSeconds;
    }, [fileUrl, frameSeconds]);

    return (
        <div className="grid justify-items-center gap-1.5">
            <video
                ref={videoRef}
                muted
                playsInline
                preload="metadata"
                className="hidden aspect-video w-40 rounded-lg border-2 border-white bg-black object-cover @xl:block"
            />
            <span className="rounded-md bg-black/85 px-2 py-1 text-xs font-semibold whitespace-nowrap text-white tabular-nums">
                {formatClock(seconds)}
                {clipRank !== null && (
                    <span className="text-[oklch(0.8_0.11_257)]"> · Corte {clipRank}</span>
                )}
            </span>
        </div>
    );
}
