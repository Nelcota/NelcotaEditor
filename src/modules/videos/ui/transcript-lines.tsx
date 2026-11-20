import type { TranscriptLineView } from "#/modules/transcription/transcript-view";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";

interface TranscriptLinesProps {
    lines: Array<TranscriptLineView>;
    currentSeconds: number;
    onSeek: (seconds: number) => void;
}

/** The line the original is playing now is marked, so the reader can follow along. */
function toPlayingAriaCurrent(
    line: TranscriptLineView,
    currentSeconds: number,
): "time" | undefined {
    if (currentSeconds < line.startSeconds || currentSeconds >= line.endSeconds) {
        return undefined;
    }

    return "time";
}

/** Every line is a button: it moves the original video to where the line is said. */
export function TranscriptLines({ lines, currentSeconds, onSeek }: TranscriptLinesProps) {
    return (
        <ol className="grid max-h-[28rem] gap-0.5 overflow-y-auto rounded-xl border bg-background/40 p-1.5">
            {lines.map((line) => (
                <li key={`${line.startSeconds}-${line.endSeconds}`}>
                    <button
                        type="button"
                        onClick={() => onSeek(line.startSeconds)}
                        aria-current={toPlayingAriaCurrent(line, currentSeconds)}
                        className={cn(
                            "grid w-full grid-cols-[3.5rem_minmax(0,1fr)] gap-3 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99]",
                            "aria-[current=time]:bg-accent",
                        )}
                    >
                        <span className="pt-px text-xs font-bold text-muted-foreground tabular-nums">
                            {formatClock(line.startSeconds)}
                        </span>
                        <span className="max-w-prose">{line.text}</span>
                    </button>
                </li>
            ))}
        </ol>
    );
}
