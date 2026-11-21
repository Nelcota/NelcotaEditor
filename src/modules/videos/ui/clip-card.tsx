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

const ICON_BUTTON_CLASS = "size-10 min-w-0 shrink-0 px-0 has-[>svg]:px-0";

/** The actions under a card: download takes the room, Studio and copy are icons with their names read out. */
function ClipCardActions({ item }: { item: LibraryClip }): ReactNode {
    const clip = item.clip;

    if (clip.downloadUrl === null) {
        return null;
    }

    return (
        <div className="flex gap-2">
            {/* Two phone columns leave no room for the word; the icon keeps it as its name. */}
            <ClipDownloadLink
                clip={clip}
                label="Baixar"
                emphasis="secondary"
                className="min-w-0 flex-1 max-sm:px-0"
                labelClassName="max-sm:sr-only"
            />
            <OpenInStudioLink
                videoId={item.videoId}
                clipId={clip.id}
                className={ICON_BUTTON_CLASS}
                labelClassName="sr-only"
            />
            <CopyTitleButton
                title={clip.title}
                className={ICON_BUTTON_CLASS}
                labelClassName="sr-only"
            />
        </div>
    );
}

/** One library clip at its real 9:16 shape: it plays in place, then its title, score, source and actions. */
export function ClipCard({ item }: { item: LibraryClip }): ReactNode {
    const clip = item.clip;
    const durationSeconds = Math.round(clip.endSeconds - clip.startSeconds);

    return (
        <li className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
            <ClipPreview clip={clip} />
            <div className="grid min-w-0 gap-1.5">
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
            <ClipCardActions item={item} />
        </li>
    );
}
