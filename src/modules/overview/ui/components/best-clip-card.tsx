import { Link } from "@tanstack/react-router";
import { SCORE_LABEL, SCORE_SCALE } from "#/modules/videos/model/clip-score";
import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import { ScoreChip } from "#/shared/ui/score-chip";
import {
    CLIP_FRAME_CLASS,
    VerticalClipPlayer,
} from "#/shared/ui/media-player/vertical-clip-player";
import type { LibraryClip } from "#/modules/videos/model/video-views";
import { formatClock } from "#/shared/ui/format";

/** Best clips are rendered ones, so the file is there; the empty frame only guards the type. */
function BestClipMedia({ title, fileUrl }: { title: string; fileUrl: string | null }) {
    if (fileUrl === null) {
        return <div className={CLIP_FRAME_CLASS} />;
    }

    return <VerticalClipPlayer label={`Corte: ${title}`} fileUrl={fileUrl} />;
}

export function BestClipCard({ item }: { item: LibraryClip }) {
    const clip = item.clip;

    return (
        <li className="grid snap-start content-start gap-2">
            <BestClipMedia title={clip.title} fileUrl={clip.fileUrl} />
            <div className="grid gap-1">
                <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground tabular-nums">
                    <ScoreChip
                        score={clip.score}
                        scale={SCORE_SCALE}
                        label={SCORE_LABEL}
                        mascotIndex={STAGE_CREW.selecting}
                    />
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
