import { isVideoWorking } from "#/modules/video-records/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";

/** Ring thickness as a share of the mascot, so the ring works at any size. */
const RING_MASK = "radial-gradient(circle, transparent 62%, #000 64%)";

function StatusMark({ video }: { video: VideoSummary }) {
    if (isVideoWorking(video.status) === true) {
        return (
            <span
                aria-hidden="true"
                className="absolute -inset-[3px] rounded-full"
                style={{
                    background: `conic-gradient(var(--primary) ${video.progressPercent}%, var(--muted) 0)`,
                    mask: RING_MASK,
                    WebkitMask: RING_MASK,
                }}
            />
        );
    }

    if (video.status === "failed") {
        return (
            <span
                aria-hidden="true"
                className="absolute -right-px -bottom-px size-2.5 rounded-full bg-destructive ring-2 ring-card"
            />
        );
    }

    return null;
}

/** A video's mascot with its live mark: a progress ring while working, a red dot when it failed. */
export function MarkedVideoMascot({
    video,
    className,
}: {
    video: VideoSummary;
    className?: string;
}) {
    return (
        <span className="relative inline-grid shrink-0 place-items-center">
            <StatusMark video={video} />
            <VideoMascot videoId={video.id} className={className} />
        </span>
    );
}
