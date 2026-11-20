import { useState } from "react";
import type { PointerEvent, RefObject } from "react";
import { secondsAtPointer } from "#/modules/videos/ui/studio/timeline-geometry";
import type { TimelineWindow } from "#/modules/videos/ui/studio/timeline-geometry";

interface ActiveDrag<Edge extends string> {
    edge: Edge;
    seconds: number;
    hasMoved: boolean;
}

export interface EdgeDrag<Edge extends string> {
    /** The edge being dragged and where it is now; null when nothing is dragged. */
    active: ActiveDrag<Edge> | null;
    handlers: (edge: Edge) => {
        onPointerDown: (event: PointerEvent<HTMLElement>) => void;
        onPointerMove: (event: PointerEvent<HTMLElement>) => void;
        onPointerUp: (event: PointerEvent<HTMLElement>) => void;
        onPointerCancel: () => void;
    };
}

interface EdgeDragInput<Edge extends string> {
    laneRef: RefObject<HTMLElement | null>;
    window: TimelineWindow;
    /** Keeps the edge inside its limits while it moves. */
    limit: (edge: Edge, seconds: number) => number;
    /** Called once, when the pointer lets go: one drag is one step in the undo history. */
    onCommit: (edge: Edge, seconds: number) => void;
}

/** Dragging an edge on the timeline: shown live, saved when released. */
export function useEdgeDrag<Edge extends string>(input: EdgeDragInput<Edge>): EdgeDrag<Edge> {
    const [active, setActive] = useState<ActiveDrag<Edge> | null>(null);

    const readSeconds = (edge: Edge, clientX: number): number | null => {
        const lane = input.laneRef.current;

        if (lane === null) {
            return null;
        }

        return input.limit(edge, secondsAtPointer(input.window, lane, clientX));
    };

    const handlers = (edge: Edge) => ({
        onPointerDown: (event: PointerEvent<HTMLElement>): void => {
            const seconds = readSeconds(edge, event.clientX);

            if (seconds === null) {
                return;
            }

            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            setActive({ edge, seconds, hasMoved: false });
        },
        onPointerMove: (event: PointerEvent<HTMLElement>): void => {
            const seconds = readSeconds(edge, event.clientX);

            if (active === null || seconds === null) {
                return;
            }

            setActive({ edge, seconds, hasMoved: true });
        },
        onPointerUp: (event: PointerEvent<HTMLElement>): void => {
            const seconds = readSeconds(edge, event.clientX);
            setActive(null);

            // A click on an edge without moving must not nudge it by the pointer's offset.
            if (seconds === null || active?.hasMoved !== true) {
                return;
            }

            input.onCommit(edge, seconds);
        },
        onPointerCancel: (): void => setActive(null),
    });

    return { active, handlers };
}
