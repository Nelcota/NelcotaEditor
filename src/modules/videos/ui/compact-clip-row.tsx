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

const PHONE_ICON_BUTTON_CLASS = "max-sm:size-10 max-sm:min-w-0 max-sm:has-[>svg]:px-0";

/** One library clip in one line: a small preview, title, score and source, why on demand. */
export function CompactClipRow({ item }: { item: LibraryClip }): ReactNode {
    const clip = item.clip;
    const durationSeconds = Math.round(clip.endSeconds - clip.startSeconds);

    return (
        <li className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-x-4 gap-y-3 border-b py-3 last:border-b-0 lg:grid-cols-[56px_minmax(0,1fr)_auto] lg:items-center">
            <ClipPreview clip={clip} />
            <div className="grid min-w-0 gap-1">
                <h2 className="leading-snug font-extrabold">{clip.title}</h2>
                <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground tabular-nums">
                    <ScoreChip score={clip.score} />
                    <span className="min-w-0">
                        <SourceVideoLink item={item} />
                    </span>
                    <span className="whitespace-nowrap">{formatClock(durationSeconds)}</span>
                </p>
                <ClipReasonDisclosure reason={clip.reason} />
            </div>
            {clip.downloadUrl !== null && (
                // On phones Baixar and Copiar título become 40px icons and the Studio link reads
                // "Editar" (each name stays whole), so the three actions share one row.
                <div className="col-span-2 flex gap-2 sm:flex-wrap lg:col-span-1">
                    <ClipDownloadLink
                        clip={clip}
                        label="Baixar"
                        emphasis="secondary"
                        className={PHONE_ICON_BUTTON_CLASS}
                        labelClassName="max-sm:sr-only"
                    />
                    <OpenInStudioLink
                        videoId={item.videoId}
                        clipId={clip.id}
                        className="max-sm:flex-1"
                        placeClassName="max-sm:sr-only"
                    />
                    <CopyTitleButton
                        title={clip.title}
                        className={PHONE_ICON_BUTTON_CLASS}
                        labelClassName="max-sm:sr-only"
                    />
                </div>
            )}
        </li>
    );
}
