import { useRef } from "react";
import type { ReactNode } from "react";
import type { CaptionCue, StudioDraft } from "#/modules/clips/clip-studio.schema";
import { movedCue, parseActiveEdge, parseEdge, shownCue } from "#/modules/studio/ui/cue-drag";
import { cueText } from "#/modules/studio/ui/cue-editing";
import { toPercent } from "#/modules/studio/ui/timeline-geometry";
import type { TimelineWindow } from "#/modules/studio/ui/timeline-geometry";
import { useEdgeDrag } from "#/modules/studio/ui/use-edge-drag";
import { cn } from "#/shared/ui/cn";

interface CueTrackProps {
    draft: StudioDraft;
    window: TimelineWindow;
    playingIndex: number;
    openIndex: number | null;
    isLocked: boolean;
    onOpen: (index: number) => void;
    onRetime: (index: number, cue: CaptionCue) => void;
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

    const dragged = parseActiveEdge(drag.active);

    return (
        <div ref={laneRef} className="relative h-9">
            {draft.cues.map((_, index) => {
                const cue = shownCue(draft, index, dragged);

                if (cue === undefined) {
                    return null;
                }

                const left = toPercent(window, cue.startSeconds);
                const width = toPercent(window, cue.endSeconds) - left;

                return (
                    <div
                        key={`${draft.cues[index]?.startSeconds}-${index}`}
                        className={cn(
                            "absolute inset-y-0.5 overflow-hidden rounded-md border bg-secondary text-xs font-semibold text-muted-foreground",
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
