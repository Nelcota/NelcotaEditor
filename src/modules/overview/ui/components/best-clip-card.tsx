import { Link } from "@tanstack/react-router";
import { ClipPreview } from "#/modules/videos/ui/components/clip-preview";
import { ScoreChip } from "#/modules/videos/ui/components/score-chip";
import type { LibraryClip } from "#/modules/videos/model/video-views";
import { formatClock } from "#/shared/ui/format";

export function BestClipCard({ item }: { item: LibraryClip }) {
    const clip = item.clip;

    return (
        <li className="grid snap-start content-start gap-2">
            <ClipPreview clip={clip} />
            <div className="grid gap-1">
                <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground tabular-nums">
                    <ScoreChip score={clip.score} />
                    {formatClock(clip.endSeconds - clip.startSeconds)}
                </p>
                <p title={clip.title} className="line-clamp-2 text-sm leading-snug font-medium">
                    {clip.title}
                </p>
                <Link
                    to="/videos/$videoId"
                    params={{ videoId: item.videoId }}
                    title={item.videoTitle}
                    className="truncate rounded text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none motion-safe:active:scale-[0.99]"
                >
                    {item.videoTitle}
                </Link>
            </div>
        </li>
    );
}
