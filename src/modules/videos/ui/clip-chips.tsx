import type { ClipView } from "#/modules/clips/clip-view";
import { cn } from "#/shared/ui/cn";

// One row per clip, the full width of the list. The title grows to two lines instead of being cut:
// picking a clip means reading its name; a title with no spaces breaks anywhere.
const ROW_CLASS =
    "group flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-start text-sm font-medium outline-none transition-[color,background-color,box-shadow,scale] hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]";

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
        <span className="font-mono text-xs font-semibold text-success tabular-nums">
            {clip.score}
        </span>
    );
}

const PLACEHOLDER_CLASS =
    "flex min-h-12 w-full items-center gap-3 rounded-xl border border-dashed px-2 text-sm text-muted-foreground";

/** A slot for a clip Brilho has not picked yet; the number continues after the real ones. */
function PlaceholderChip({ number }: { number: number }) {
    return (
        <span className={PLACEHOLDER_CLASS}>
            <span className="grid size-7 place-items-center rounded-lg bg-secondary text-xs tabular-nums">
                {number}
            </span>
            Luna guarda o lugar
        </span>
    );
}

/** Every clip, best first, as a numbered row; the number matches the marks on the bar. */
export function ClipChips({
    clips,
    selectedClipId,
    onSelectClip,
    placeholderCount,
}: ClipChipsProps) {
    return (
        <div role="group" aria-label="Cortes, pela nota do Brilho" className="grid gap-0.5">
            {clips.map((clip, index) => (
                <button
                    key={clip.id}
                    type="button"
                    aria-pressed={clip.id === selectedClipId}
                    onClick={() => onSelectClip(clip)}
                    title={clip.title}
                    className={cn(
                        ROW_CLASS,
                        "aria-pressed:bg-primary/8 aria-pressed:hover:bg-primary/10",
                        clip.status === "failed" && "text-destructive",
                    )}
                >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-xs text-secondary-foreground tabular-nums group-aria-pressed:bg-primary-solid group-aria-pressed:text-primary-foreground">
                        {index + 1}
                    </span>
                    <span className="line-clamp-2 min-w-0 flex-1 leading-snug [overflow-wrap:anywhere]">
                        {clip.title}
                    </span>
                    <ScoreOrState clip={clip} />
                </button>
            ))}
            {Array.from({ length: Math.max(0, placeholderCount) }, (_, index) => (
                <PlaceholderChip key={index} number={clips.length + index + 1} />
            ))}
        </div>
    );
}
