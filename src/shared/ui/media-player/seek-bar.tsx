import { useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";

const PERCENT = 100;

/** Where a moment sits along the bar, as a percentage; the caller passes a positive duration. */
export function toBarPercent(seconds: number, durationSeconds: number): number {
    if (Number.isFinite(seconds) === false || durationSeconds <= 0) {
        return 0;
    }

    return Math.min(PERCENT, Math.max(0, (seconds / durationSeconds) * PERCENT));
}

function readPointerSeconds(event: PointerEvent<HTMLElement>, durationSeconds: number): number {
    const box = event.currentTarget.getBoundingClientRect();

    if (box.width <= 0) {
        return 0;
    }

    const share = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    return share * durationSeconds;
}

interface SeekBarProps {
    currentSeconds: number;
    durationSeconds: number;
    bufferedSeconds: number;
    onSeek: (seconds: number) => void;
    label: string;
    /** Marks drawn on the rail (the clips, on the original); they never take clicks. */
    marks?: ReactNode;
    /** What floats above the pointer while hovering; the time alone when not given. */
    renderPreview?: (seconds: number) => ReactNode;
    size?: "md" | "sm";
}

function HoverPreview({
    seconds,
    percent,
    children,
}: {
    seconds: number;
    percent: number;
    children: ReactNode;
}): ReactNode {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2"
            // Kept inside the bar so a preview near either end never leaves the player.
            style={{ left: `clamp(5.5rem, ${percent}%, calc(100% - 5.5rem))` }}
        >
            {children}
            <span className="sr-only">{formatClock(seconds)}</span>
        </div>
    );
}

function DefaultPreview({ seconds }: { seconds: number }): ReactNode {
    return (
        <span className="rounded-md bg-black/80 px-2 py-1 text-xs font-semibold text-white tabular-nums">
            {formatClock(seconds)}
        </span>
    );
}

/**
 * The progress bar: a native slider sits on top, invisible, so clicking, dragging and the arrow
 * keys all move the video; the rail under it only draws.
 */
export function SeekBar(props: SeekBarProps): ReactNode {
    const { currentSeconds, durationSeconds, bufferedSeconds, onSeek, label, size = "md" } = props;
    const [hoverSeconds, setHoverSeconds] = useState<number | null>(null);
    const maxSeconds = Math.max(1, Math.round(durationSeconds));
    const playedPercent = toBarPercent(currentSeconds, durationSeconds);
    const renderPreview =
        props.renderPreview ?? ((seconds: number) => <DefaultPreview seconds={seconds} />);

    return (
        <div
            className={cn(
                "group/seek relative flex items-center rounded-full has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-ring",
                size === "md" && "h-4",
                size === "sm" && "h-3",
            )}
            onPointerMove={(event) => setHoverSeconds(readPointerSeconds(event, durationSeconds))}
            onPointerLeave={() => setHoverSeconds(null)}
        >
            <div className="relative h-1.5 w-full origin-center scale-y-[0.67] rounded-full bg-white/25 transition-[scale] group-hover/seek:scale-y-100">
                {/* Fills grow with scaleX, not width, so playback updates never re-run layout;
                    the clipping wrapper keeps their ends rounded at any scale. */}
                <span className="absolute inset-0 overflow-hidden rounded-full">
                    <span
                        className="absolute inset-0 origin-left bg-white/30"
                        style={{
                            transform: `scaleX(${toBarPercent(bufferedSeconds, durationSeconds) / PERCENT})`,
                        }}
                    />
                    <span
                        className="absolute inset-0 origin-left bg-white"
                        style={{ transform: `scaleX(${playedPercent / PERCENT})` }}
                    />
                </span>
                {props.marks}
                <span
                    aria-hidden="true"
                    className={cn(
                        "absolute top-1/2 z-10 -translate-1/2 rounded-full bg-white shadow-md",
                        size === "md" && "size-3.5",
                        size === "sm" &&
                            "size-2.5 scale-0 transition-transform group-hover/seek:scale-100",
                    )}
                    style={{ left: `${playedPercent}%` }}
                />
            </div>
            <input
                type="range"
                min={0}
                max={maxSeconds}
                step={1}
                value={Math.min(Math.round(currentSeconds), maxSeconds)}
                onChange={(event) => onSeek(Number(event.target.value))}
                aria-label={label}
                aria-valuetext={`${formatClock(currentSeconds)} de ${formatClock(durationSeconds)}`}
                className="absolute inset-0 z-20 size-full cursor-pointer opacity-0"
            />
            {hoverSeconds !== null && (
                <HoverPreview
                    seconds={hoverSeconds}
                    percent={toBarPercent(hoverSeconds, durationSeconds)}
                >
                    {renderPreview(hoverSeconds)}
                </HoverPreview>
            )}
        </div>
    );
}
