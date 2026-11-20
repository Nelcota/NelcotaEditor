import { Link } from "@tanstack/react-router";
import { ClipPreview } from "#/modules/videos/ui/clip-preview";
import type { LibraryClip } from "#/modules/videos/video-views";
import { formatClock } from "#/shared/ui/format";

export function BestClipCard({ item }: { item: LibraryClip }) {
    const clip = item.clip;

    return (
        <li className="grid snap-start content-start gap-2">
            <ClipPreview clip={clip} />
            <div className="grid gap-1">
                <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground tabular-nums">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">
                        Nota {clip.score}
                    </span>
                    {formatClock(clip.endSeconds - clip.startSeconds)}
                </p>
                <p className="line-clamp-2 text-sm leading-snug font-semibold">{clip.title}</p>
                <Link
                    to="/videos/$videoId"
                    params={{ videoId: item.videoId }}
                    className="truncate rounded text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                    {item.videoTitle}
                </Link>
            </div>
        </li>
    );
}
