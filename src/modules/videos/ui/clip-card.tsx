import type { ReactNode } from "react";
import { ClipDownloadLink } from "#/modules/videos/ui/clip-download-link";
import { ClipPreview } from "#/modules/videos/ui/clip-preview";
import { ClipReasonDisclosure } from "#/modules/videos/ui/clip-reason-disclosure";
import { CopyTitleButton } from "#/modules/videos/ui/copy-title-button";
import { OpenInStudioLink } from "#/modules/videos/ui/open-in-studio-link";
import { ScoreChip } from "#/modules/videos/ui/score-chip";
import { SourceVideoLink } from "#/modules/videos/ui/source-video-link";
import type { LibraryClip } from "#/modules/videos/video-views";
import { formatClock } from "#/shared/ui/format";

/** Grows to share a row, and drops to its own row when the card is too narrow for both words. */
const SHARED_ROW_BUTTON_CLASS = "min-w-0 flex-auto";

/** The actions under a card: the blue download (the reference's invite button), then edit and copy. */
function ClipCardActions({ item }: { item: LibraryClip }): ReactNode {
    const clip = item.clip;

    if (clip.downloadUrl === null) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
            <ClipDownloadLink
                clip={clip}
                label="Baixar"
                emphasis="primary"
                className="min-w-0 basis-full"
            />
            <OpenInStudioLink
                videoId={item.videoId}
                clipId={clip.id}
                className={SHARED_ROW_BUTTON_CLASS}
                placeClassName="sr-only"
            />
            <CopyTitleButton title={clip.title} className={SHARED_ROW_BUTTON_CLASS} />
        </div>
    );
}

/** One library clip at its real 9:16 shape: it plays in place, then its title, score, source and actions. */
export function ClipCard({ item }: { item: LibraryClip }): ReactNode {
    const clip = item.clip;
    const durationSeconds = Math.round(clip.endSeconds - clip.startSeconds);

    return (
        <li className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 overflow-hidden rounded-2xl border border-card-border bg-card pb-3">
            <ClipPreview clip={clip} />
            <div className="grid min-w-0 gap-1.5 px-3">
                <h2
                    title={clip.title}
                    className="line-clamp-2 leading-snug font-medium [overflow-wrap:anywhere]"
                >
                    {clip.title}
                </h2>
                <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground tabular-nums">
                    <ScoreChip score={clip.score} />
                    <span className="whitespace-nowrap">{formatClock(durationSeconds)}</span>
                </p>
                <p className="min-w-0 text-xs text-muted-foreground">
                    <SourceVideoLink item={item} />
                </p>
                <ClipReasonDisclosure reason={clip.reason} />
            </div>
            <div className="px-3">
                <ClipCardActions item={item} />
            </div>
        </li>
    );
}
