import type { KeyboardEvent, ReactNode, RefObject } from "react";
import type { StudioDraft } from "#/modules/clips/clip-studio.schema";
import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS } from "#/modules/highlights/highlight-limits";
import { clamp, toPercent } from "#/modules/videos/ui/studio/timeline-geometry";
import type { TimelineWindow } from "#/modules/videos/ui/studio/timeline-geometry";
import { useEdgeDrag } from "#/modules/videos/ui/studio/use-edge-drag";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";

type TrimEdge = "start" | "end";

interface ActiveEdge {
    edge: TrimEdge;
    seconds: number;
}

const TRIM_EDGES: ReadonlyArray<TrimEdge> = ["start", "end"];
const KEY_STEP_SECONDS = 0.1;
const SHIFT_KEY_STEP_SECONDS = 1;
const EDGE_LABELS: Record<TrimEdge, string> = { start: "Início", end: "Fim" };

interface TrimRangeProps {
    draft: StudioDraft;
    window: TimelineWindow;
    laneRef: RefObject<HTMLDivElement | null>;
    videoDurationSeconds: number;
    isLocked: boolean;
    onTrim: (startSeconds: number, endSeconds: number) => void;
}

/** Where an edge may go: the clip stays 15–90 s long and inside the video. */
function limitEdge(draft: StudioDraft, durationSeconds: number, edge: TrimEdge, seconds: number) {
    if (edge === "start") {
        const earliest = Math.max(0, draft.endSeconds - MAX_CLIP_SECONDS);
        return clamp(seconds, earliest, draft.endSeconds - MIN_CLIP_SECONDS);
    }

    const latest = Math.min(durationSeconds, draft.startSeconds + MAX_CLIP_SECONDS);
    return clamp(seconds, draft.startSeconds + MIN_CLIP_SECONDS, latest);
}

/** Said in red while dragging when the edge has reached the shortest or longest clip. */
function describeLimit(draft: StudioDraft, drag: ActiveEdge | null): string | null {
    if (drag === null) {
        return null;
    }

    let length = draft.endSeconds - drag.seconds;

    if (drag.edge === "end") {
        length = drag.seconds - draft.startSeconds;
    }

    if (length <= MIN_CLIP_SECONDS + KEY_STEP_SECONDS / 2) {
        return `Mínimo de ${MIN_CLIP_SECONDS} s`;
    }

    if (length >= MAX_CLIP_SECONDS - KEY_STEP_SECONDS / 2) {
        return `Máximo de ${MAX_CLIP_SECONDS} s`;
    }

    return null;
}

/** The clip's stretch on the timeline, with a handle on each side to drag or move by keyboard. */
export function TrimRange(props: TrimRangeProps): ReactNode {
    const { draft, window, laneRef, videoDurationSeconds, isLocked, onTrim } = props;
    const limit = (edge: TrimEdge, seconds: number): number =>
        limitEdge(draft, videoDurationSeconds, edge, seconds);
    const commit = (edge: TrimEdge, seconds: number): void => {
        if (edge === "start") {
            onTrim(seconds, draft.endSeconds);
            return;
        }

        onTrim(draft.startSeconds, seconds);
    };
    const drag = useEdgeDrag<TrimEdge>({ laneRef, window, limit, onCommit: commit });
    const active = drag.active;
    let startSeconds = draft.startSeconds;
    let endSeconds = draft.endSeconds;

    if (active?.edge === "start") {
        startSeconds = active.seconds;
    }

    if (active?.edge === "end") {
        endSeconds = active.seconds;
    }

    const onKeyDown = (edge: TrimEdge, event: KeyboardEvent<HTMLElement>): void => {
        const directions: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
        const direction = directions[event.key];

        if (direction === undefined) {
            return;
        }

        event.preventDefault();
        let step = KEY_STEP_SECONDS;

        if (event.shiftKey === true) {
            step = SHIFT_KEY_STEP_SECONDS;
        }

        const current: Record<TrimEdge, number> = {
            start: draft.startSeconds,
            end: draft.endSeconds,
        };

        commit(edge, limit(edge, current[edge] + direction * step));
    };

    const left = toPercent(window, startSeconds);
    const right = toPercent(window, endSeconds);
    const edgeSeconds: Record<TrimEdge, number> = { start: startSeconds, end: endSeconds };
    const edgePercent: Record<TrimEdge, number> = { start: left, end: right };
    const limitMessage = describeLimit(draft, active);

    return (
        <>
            <div
                className="pointer-events-none absolute inset-y-0 left-0 z-10 bg-background/75"
                style={{ width: `${left}%` }}
            />
            <div
                className="pointer-events-none absolute inset-y-0 right-0 z-10 bg-background/75"
                style={{ left: `${right}%` }}
            />
            <div
                className="pointer-events-none absolute -inset-y-0.5 z-10 rounded-lg border-[3px] border-primary"
                style={{ left: `${left}%`, width: `${right - left}%` }}
            />
            {TRIM_EDGES.map((edge) => (
                <button
                    key={edge}
                    type="button"
                    role="slider"
                    aria-label={`${EDGE_LABELS[edge]} do corte`}
                    aria-valuemin={0}
                    aria-valuemax={videoDurationSeconds}
                    aria-valuenow={edgeSeconds[edge]}
                    aria-valuetext={formatClock(edgeSeconds[edge])}
                    disabled={isLocked}
                    onKeyDown={(event) => onKeyDown(edge, event)}
                    {...drag.handlers(edge)}
                    className={cn(
                        "absolute top-1/2 z-20 grid h-10 w-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none place-items-center rounded-md bg-primary outline-none focus-visible:ring-4 focus-visible:ring-ring/50 disabled:cursor-not-allowed",
                        "after:h-4 after:w-0.5 after:rounded-full after:bg-primary-foreground",
                    )}
                    style={{ left: `${edgePercent[edge]}%` }}
                />
            ))}
            {active !== null && (
                <span
                    className={cn(
                        "pointer-events-none absolute -top-9 z-30 -translate-x-1/2 rounded-md px-2 py-1 text-xs font-bold whitespace-nowrap tabular-nums",
                        limitMessage === null && "bg-foreground text-background",
                        limitMessage !== null && "bg-destructive text-white",
                    )}
                    style={{ left: `${toPercent(window, active.seconds)}%` }}
                >
                    {limitMessage ??
                        `${EDGE_LABELS[active.edge]} ${formatClock(active.seconds)} · corte com ${Math.round(endSeconds - startSeconds)} s`}
                </span>
            )}
        </>
    );
}
