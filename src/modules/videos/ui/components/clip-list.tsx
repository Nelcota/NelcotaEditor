import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import { SelectedClipDetails } from "#/modules/videos/ui/components/selected-clip-details";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";
import { Mascot } from "#/shared/ui/mascot";

// Rows: 16px in on both sides (the panel's text line). The number badge is the row's icon column;
// the open row's details start on the title line after it (16 + 28 + 12 = 56px).
const ROW_CLASS =
    "group flex min-h-16 w-full items-center gap-3 px-4 py-3 text-start outline-none transition-[background-color,scale] hover:bg-secondary/60 motion-safe:active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring aria-expanded:bg-secondary/60";

function ScoreOrState({ clip }: { clip: ClipView }): ReactNode {
    if (clip.status === "failed") {
        return <span className="text-xs text-destructive">falhou</span>;
    }

    if (clip.status !== "done") {
        return <span className="text-xs text-muted-foreground">montando</span>;
    }

    return (
        <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums">
            <Mascot index={STAGE_CREW.selecting} className="size-4" />
            {clip.score}
        </span>
    );
}

interface ClipRowProps {
    clip: ClipView;
    number: number;
    isOpen: boolean;
    onSelect: () => void;
}

function ClipRow({ clip, number, isOpen, onSelect }: ClipRowProps): ReactNode {
    return (
        <button
            type="button"
            aria-expanded={isOpen}
            onClick={onSelect}
            className={cn(ROW_CLASS, clip.status === "failed" && "text-destructive")}
        >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-medium text-muted-foreground tabular-nums group-aria-expanded:bg-primary-solid group-aria-expanded:text-primary-foreground">
                {number}
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="line-clamp-2 leading-snug font-medium [overflow-wrap:anywhere]">
                    {clip.title}
                </span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {formatClock(clip.startSeconds)} a {formatClock(clip.endSeconds)}
                </span>
            </span>
            <ScoreOrState clip={clip} />
        </button>
    );
}

/** A slot for a clip Brilho has not picked yet; the number continues after the real ones. */
function PlaceholderRow({ number }: { number: number }): ReactNode {
    return (
        <li className="flex min-h-16 items-center gap-3 px-4 text-sm text-muted-foreground">
            <span className="grid size-7 place-items-center rounded-lg border border-dashed text-xs tabular-nums">
                {number}
            </span>
            Corte a caminho
        </li>
    );
}

interface ClipListProps {
    videoId: string;
    clips: Array<ClipView>;
    selectedClipId: string | null;
    onSelectClip: (clip: ClipView) => void;
    placeholderCount: number;
    canRetry: boolean;
}

/** Every clip, best first; the one picked opens in place with Brilho's reason and its actions. */
export function ClipList(props: ClipListProps): ReactNode {
    const { videoId, clips, selectedClipId, onSelectClip, placeholderCount, canRetry } = props;

    return (
        <ol
            aria-label="Cortes, pela nota do Brilho"
            className="divide-y overflow-hidden rounded-2xl border bg-card"
        >
            {clips.map((clip, index) => (
                <li key={clip.id}>
                    <ClipRow
                        clip={clip}
                        number={index + 1}
                        isOpen={clip.id === selectedClipId}
                        onSelect={() => onSelectClip(clip)}
                    />
                    {clip.id === selectedClipId && (
                        <div className="bg-secondary/60 ps-14 pe-4 pb-4">
                            <SelectedClipDetails
                                videoId={videoId}
                                clip={clip}
                                canRetry={canRetry}
                            />
                        </div>
                    )}
                </li>
            ))}
            {Array.from({ length: Math.max(0, placeholderCount) }, (_, index) => (
                <PlaceholderRow key={index} number={clips.length + index + 1} />
            ))}
        </ol>
    );
}
