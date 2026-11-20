import { Link } from "@tanstack/react-router";
import type { LibraryClip } from "#/modules/videos/video-views";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";

/** Outside its video, a clip says where it came from: the video's mascot and a link to it. */
export function SourceVideoLink({ item }: { item: LibraryClip }) {
    const videoId = item.videoId;
    const videoTitle = item.videoTitle;

    return (
        <Link
            to="/videos/$videoId"
            params={{ videoId }}
            title={videoTitle}
            className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99]"
        >
            <VideoMascot videoId={videoId} className="size-5" />
            <span className="truncate">{videoTitle}</span>
        </Link>
    );
}
