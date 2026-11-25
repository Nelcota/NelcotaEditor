import type { ReactNode } from "react";
import { CopyTitleButton } from "#/modules/videos/ui/components/copy-title-button";
import { OpenInStudioLink } from "#/modules/videos/ui/components/open-in-studio-link";
import { SourceVideoLink } from "#/modules/videos/ui/components/source-video-link";
import { SCORE_LABEL, SCORE_SCALE } from "#/modules/videos/model/clip-score";
import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import type { LibraryClip } from "#/modules/videos/model/video-views";
import { cn } from "#/shared/ui/cn";
import { DownloadLink } from "#/shared/ui/download-link";
import { formatClock, formatShortDate } from "#/shared/ui/format";
import { ScoreChip } from "#/shared/ui/score-chip";

/**
 * Shared by the head and every row, so the columns line up. Each row is its own grid, so the
 * actions column has a fixed width: three icons, then three labelled buttons once there is room.
 */
export const CLIP_TABLE_COLUMNS =
    "@4xl/cliptable:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_6.5rem_5rem_4rem_8.5rem] @7xl/cliptable:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_6.5rem_5rem_4rem_23rem]";

/** Icon only until the table is wide enough for the words; the name is still read out. */
const ACTION_LABEL_CLASS = "@max-7xl/cliptable:sr-only";
const ICON_ACTION_CLASS = "@max-7xl/cliptable:w-10 @max-7xl/cliptable:has-[>svg]:px-0";

function ClipScore({ item }: { item: LibraryClip }): ReactNode {
    return (
        <ScoreChip
            score={item.clip.score}
            scale={SCORE_SCALE}
            label={SCORE_LABEL}
            mascotIndex={STAGE_CREW.selecting}
        />
    );
}

/** Download stays first and primary in spirit, but outlined: every row has one. */
function ClipRowActions({ item }: { item: LibraryClip }): ReactNode {
    const clip = item.clip;

    if (clip.downloadUrl === null) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <DownloadLink
                href={clip.downloadUrl}
                label="Baixar"
                emphasis="secondary"
                className={ICON_ACTION_CLASS}
                labelClassName={ACTION_LABEL_CLASS}
            />
            <OpenInStudioLink
                videoId={item.videoId}
                clipId={clip.id}
                className={ICON_ACTION_CLASS}
                labelClassName={ACTION_LABEL_CLASS}
                placeClassName="sr-only"
            />
            <CopyTitleButton
                title={clip.title}
                className={cn("@max-7xl/cliptable:min-w-0", ICON_ACTION_CLASS)}
                labelClassName={ACTION_LABEL_CLASS}
            />
        </div>
    );
}

/**
 * One clip as a table row. From a wide table every fact has its column; narrower ones keep the
 * title with its score, length and video underneath, then the actions.
 */
export function ClipTableRow({ item }: { item: LibraryClip }): ReactNode {
    const clip = item.clip;
    const durationSeconds = Math.round(clip.endSeconds - clip.startSeconds);

    return (
        <li
            className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-3",
                CLIP_TABLE_COLUMNS,
            )}
        >
            <div className="grid min-w-0 gap-1">
                <h2
                    title={clip.title}
                    className="line-clamp-2 text-sm leading-snug font-semibold [overflow-wrap:anywhere]"
                >
                    {clip.title}
                </h2>
                <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground tabular-nums @4xl/cliptable:hidden">
                    <ClipScore item={item} />
                    <span className="whitespace-nowrap">{formatClock(durationSeconds)}</span>
                    <span className="min-w-0">
                        <SourceVideoLink item={item} />
                    </span>
                </p>
            </div>
            <p className="min-w-0 text-sm @max-4xl/cliptable:hidden">
                <SourceVideoLink item={item} />
            </p>
            <div className="@max-4xl/cliptable:hidden">
                <ClipScore item={item} />
            </div>
            <span className="text-sm text-muted-foreground tabular-nums @max-4xl/cliptable:hidden">
                <span className="sr-only">Duração </span>
                {formatClock(durationSeconds)}
            </span>
            <span className="text-sm text-muted-foreground tabular-nums @max-4xl/cliptable:hidden">
                <span className="sr-only">Criado em </span>
                {formatShortDate(item.createdAt)}
            </span>
            <div className="justify-self-end">
                <ClipRowActions item={item} />
            </div>
        </li>
    );
}
