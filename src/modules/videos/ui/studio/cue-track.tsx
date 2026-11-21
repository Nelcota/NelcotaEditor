import { useRef } from "react";
import type { ReactNode } from "react";
import type { CaptionCue, StudioDraft } from "#/modules/clips/clip-studio.schema";
import {
    MIN_CUE_SECONDS,
    cueLimits,
    cueText,
    retimeCue,
} from "#/modules/videos/ui/studio/cue-editing";
import { clamp, toPercent } from "#/modules/videos/ui/studio/timeline-geometry";
import type { TimelineWindow } from "#/modules/videos/ui/studio/timeline-geometry";
import { useEdgeDrag } from "#/modules/videos/ui/studio/use-edge-drag";
import { cn } from "#/shared/ui/cn";

// Keeps a dragged cue from collapsing to nothing.
const EDGE_PATTERN = /^(\d+):(start|end)$/;

interface CueTrackProps {
    draft: StudioDraft;
    window: TimelineWindow;
    playingIndex: number;
    openIndex: number | null;
    isLocked: boolean;
    onOpen: (index: number) => void;
    onRetime: (index: number, cue: CaptionCue) => void;
}

interface CueEdge {
    index: number;
    side: "start" | "end";
}

function parseEdge(edge: string): CueEdge | null {
    const match = EDGE_PATTERN.exec(edge);

    if (match === null) {
        return null;
    }

    const side = match[2];

    if (side !== "start" && side !== "end") {
        return null;
    }

    return { index: Number(match[1]), side };
}

/** The new edges of a cue when one side moves, kept between its neighbours. */
function movedCue(draft: StudioDraft, edge: CueEdge, seconds: number): CaptionCue | null {
    const cue = draft.cues[edge.index];

    if (cue === undefined) {
        return null;
    }

    const limits = cueLimits(draft, edge.index);

    if (edge.side === "start") {
        const start = clamp(seconds, limits.min, cue.endSeconds - MIN_CUE_SECONDS);
        return retimeCue(cue, start, cue.endSeconds);
    }

    const end = clamp(seconds, cue.startSeconds + MIN_CUE_SECONDS, limits.max);
    return retimeCue(cue, cue.startSeconds, end);
}

/** The cue as it looks right now: moved live while one of its sides is dragged. */
function shownCue(
    draft: StudioDraft,
    index: number,
    active: { edge: string; seconds: number } | null,
): CaptionCue | undefined {
    const cue = draft.cues[index];

    if (active === null || cue === undefined) {
        return cue;
    }

    const parsed = parseEdge(active.edge);

    if (parsed === null || parsed.index !== index) {
        return cue;
    }

    return movedCue(draft, parsed, active.seconds) ?? cue;
}

function keepSeconds(_edge: string, seconds: number): number {
    return seconds;
}

/** Each caption as a block on the timeline: click to open it, drag its sides to retime it. */
export function CueTrack(props: CueTrackProps): ReactNode {
    const { draft, window, playingIndex, openIndex, isLocked, onOpen, onRetime } = props;
    const laneRef = useRef<HTMLDivElement>(null);
    const drag = useEdgeDrag<string>({
        laneRef,
        window,
        // movedCue keeps each side between its neighbours, so the raw time is enough here.
        limit: keepSeconds,
        onCommit: (edge, seconds) => {
            const parsed = parseEdge(edge);

            if (parsed === null) {
                return;
            }

            const moved = movedCue(draft, parsed, seconds);

            if (moved === null) {
                return;
            }

            onRetime(parsed.index, moved);
        },
    });

    return (
        <div ref={laneRef} className="relative h-9">
            {draft.cues.map((_, index) => {
                const cue = shownCue(draft, index, drag.active);

                if (cue === undefined) {
                    return null;
                }

                const left = toPercent(window, cue.startSeconds);
                const width = toPercent(window, cue.endSeconds) - left;

                return (
                    <div
                        key={`${draft.cues[index]?.startSeconds}-${index}`}
                        className={cn(
                            "absolute inset-y-0.5 overflow-hidden rounded-md border bg-secondary text-xs font-bold text-muted-foreground",
                            index === playingIndex &&
                                "border-primary bg-primary/20 text-foreground",
                            index === openIndex && "border-2 border-foreground text-foreground",
                        )}
                        style={{ left: `${left}%`, width: `max(${width}%, 4px)` }}
                    >
                        <button
                            type="button"
                            title={cueText(cue)}
                            aria-label={`Abrir o bloco: ${cueText(cue)}`}
                            disabled={isLocked}
                            onClick={() => onOpen(index)}
                            className="size-full truncate px-2 text-left outline-none focus-visible:ring-4 focus-visible:ring-ring/70 focus-visible:ring-inset disabled:cursor-not-allowed"
                        >
                            {cueText(cue)}
                        </button>
                        {index === openIndex && isLocked === false && (
                            <>
                                <span
                                    aria-hidden="true"
                                    {...drag.handlers(`${index}:start`)}
                                    className="absolute inset-y-0 left-0 w-2 cursor-ew-resize touch-none bg-foreground/80 transition-colors hover:bg-foreground before:absolute before:-inset-x-2 before:inset-y-0 before:content-['']"
                                />
                                <span
                                    aria-hidden="true"
                                    {...drag.handlers(`${index}:end`)}
                                    className="absolute inset-y-0 right-0 w-2 cursor-ew-resize touch-none bg-foreground/80 transition-colors hover:bg-foreground before:absolute before:-inset-x-2 before:inset-y-0 before:content-['']"
                                />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
