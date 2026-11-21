import type { ClipView } from "#/modules/videos/video-views";
import { cn } from "#/shared/ui/cn";

// Grows to two lines instead of cutting the title: picking a clip means reading its name.
const CHIP_CLASS =
    "inline-flex min-h-10 max-w-80 items-center gap-2 rounded-[1.25rem] border bg-popover py-1.5 pr-3 pl-1.5 text-sm font-bold outline-none transition-[color,background-color,border-color,box-shadow,scale] hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]";

interface ClipChipsProps {
    clips: Array<ClipView>;
    selectedClipId: string | null;
    onSelectClip: (clip: ClipView) => void;
    placeholderCount: number;
}

function ScoreOrState({ clip }: { clip: ClipView }) {
    if (clip.status === "failed") {
        return <span className="text-xs text-destructive">falhou</span>;
    }

    if (clip.status !== "done") {
        return <span className="text-xs text-muted-foreground">montando</span>;
    }

    return (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary tabular-nums">
            {clip.score}
        </span>
    );
}

const PLACEHOLDER_CLASS =
    "inline-flex h-10 items-center gap-2 rounded-full border border-dashed py-0 pr-3 pl-1.5 text-sm text-muted-foreground";

/** A slot for a clip Brilho has not picked yet; the number continues after the real ones. */
function PlaceholderChip({ number }: { number: number }) {
    return (
        <span className={PLACEHOLDER_CLASS}>
            <span className="grid size-7 place-items-center rounded-full bg-secondary text-xs tabular-nums">
                {number}
            </span>
            Luna guarda o lugar
        </span>
    );
}

/** Every clip, best first, as a numbered button; the number matches the marks on the bar. */
export function ClipChips({
    clips,
    selectedClipId,
    onSelectClip,
    placeholderCount,
}: ClipChipsProps) {
    return (
        <div role="group" aria-label="Cortes, pela nota do Brilho" className="flex flex-wrap gap-2">
            {clips.map((clip, index) => (
                <button
                    key={clip.id}
                    type="button"
                    aria-pressed={clip.id === selectedClipId}
                    onClick={() => onSelectClip(clip)}
                    title={clip.title}
                    className={cn(
                        CHIP_CLASS,
                        "aria-pressed:border-primary aria-pressed:bg-primary/12",
                        clip.status === "failed" && "border-destructive/50",
                    )}
                >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs tabular-nums">
                        {index + 1}
                    </span>
                    <span className="line-clamp-2 text-start leading-snug">{clip.title}</span>
                    <ScoreOrState clip={clip} />
                </button>
            ))}
            {Array.from({ length: Math.max(0, placeholderCount) }, (_, index) => (
                <PlaceholderChip key={index} number={clips.length + index + 1} />
            ))}
        </div>
    );
}
