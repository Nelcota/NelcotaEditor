import { memo, useCallback, useEffect, useRef } from "react";
import type { TranscriptLineView } from "#/modules/transcription/transcript-view";
import { findLastStartedIndex } from "#/modules/videos/ui/find-last-started-index";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";

interface TranscriptLinesProps {
    lines: Array<TranscriptLineView>;
    currentSeconds: number;
    onSeek: (seconds: number) => void;
}

/** The line the original is playing now; -1 between lines. Lines come sorted by start. */
function findPlayingIndex(lines: Array<TranscriptLineView>, currentSeconds: number): number {
    const index = findLastStartedIndex(lines, currentSeconds);
    const line = lines[index];

    if (line === undefined || currentSeconds >= line.endSeconds) {
        return -1;
    }

    return index;
}

function toAriaCurrent(isPlaying: boolean): "time" | undefined {
    if (isPlaying === false) {
        return undefined;
    }

    return "time";
}

interface TranscriptLineProps {
    line: TranscriptLineView;
    isPlaying: boolean;
    onSeek: (seconds: number) => void;
}

/** Memoized: on each player tick only the line that starts or stops playing re-renders. */
const TranscriptLine = memo(function TranscriptLine({
    line,
    isPlaying,
    onSeek,
}: TranscriptLineProps) {
    return (
        <li>
            <button
                type="button"
                onClick={() => onSeek(line.startSeconds)}
                aria-current={toAriaCurrent(isPlaying)}
                className={cn(
                    "grid w-full grid-cols-[3.5rem_minmax(0,1fr)] gap-3 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]",
                    "aria-[current=time]:bg-accent",
                )}
            >
                <span className="pt-px text-xs font-bold text-muted-foreground tabular-nums">
                    {formatClock(line.startSeconds)}
                </span>
                <span className="max-w-prose">{line.text}</span>
            </button>
        </li>
    );
});

/**
 * A seek handler that keeps its identity across renders while calling the newest one, so the
 * memoized lines are not re-rendered just because the parent made a new function.
 */
function useStableSeek(onSeek: (seconds: number) => void): (seconds: number) => void {
    const onSeekRef = useRef(onSeek);

    useEffect(() => {
        onSeekRef.current = onSeek;
    }, [onSeek]);

    return useCallback((seconds: number) => onSeekRef.current(seconds), []);
}

/** Every line is a button: it moves the original video to where the line is said. */
export function TranscriptLines({ lines, currentSeconds, onSeek }: TranscriptLinesProps) {
    const playingIndex = findPlayingIndex(lines, currentSeconds);
    const stableSeek = useStableSeek(onSeek);

    return (
        <ol className="grid max-h-[28rem] gap-0.5 overflow-y-auto rounded-xl border bg-background/40 p-1.5">
            {lines.map((line, index) => (
                <TranscriptLine
                    key={`${line.startSeconds}-${line.endSeconds}`}
                    line={line}
                    isPlaying={index === playingIndex}
                    onSeek={stableSeek}
                />
            ))}
        </ol>
    );
}
