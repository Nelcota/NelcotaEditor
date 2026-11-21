import { useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";
import { secondsInLane } from "#/modules/studio/ui/timeline-geometry";
import type { LaneBox, TimelineWindow } from "#/modules/studio/ui/timeline-geometry";

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

/**
 * Dragging an edge on the timeline: shown live, saved when released. The lane is measured once
 * when the drag starts, and a move that lands on the same time changes no state.
 */
export function useEdgeDrag<Edge extends string>(input: EdgeDragInput<Edge>): EdgeDrag<Edge> {
    const [active, setActive] = useState<ActiveDrag<Edge> | null>(null);
    const laneBoxRef = useRef<LaneBox | null>(null);

    const readSeconds = (edge: Edge, clientX: number): number | null => {
        const laneBox = laneBoxRef.current;

        if (laneBox === null) {
            return null;
        }

        return input.limit(edge, secondsInLane(input.window, laneBox, clientX));
    };

    const start = (edge: Edge, event: PointerEvent<HTMLElement>): void => {
        const lane = input.laneRef.current;

        if (lane === null) {
            return;
        }

        laneBoxRef.current = lane.getBoundingClientRect();
        const seconds = readSeconds(edge, event.clientX);

        if (seconds === null) {
            return;
        }

        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        setActive({ edge, seconds, hasMoved: false });
    };

    const move = (edge: Edge, event: PointerEvent<HTMLElement>): void => {
        const seconds = readSeconds(edge, event.clientX);

        if (active === null || seconds === null) {
            return;
        }

        if (active.hasMoved === true && active.seconds === seconds) {
            return;
        }

        setActive({ edge, seconds, hasMoved: true });
    };

    const finish = (edge: Edge, event: PointerEvent<HTMLElement>): void => {
        const seconds = readSeconds(edge, event.clientX);
        laneBoxRef.current = null;
        setActive(null);

        // A click on an edge without moving must not nudge it by the pointer's offset.
        if (seconds === null || active?.hasMoved !== true) {
            return;
        }

        input.onCommit(edge, seconds);
    };

    const cancel = (): void => {
        laneBoxRef.current = null;
        setActive(null);
    };

    const handlers = (edge: Edge) => ({
        onPointerDown: (event: PointerEvent<HTMLElement>): void => start(edge, event),
        onPointerMove: (event: PointerEvent<HTMLElement>): void => move(edge, event),
        onPointerUp: (event: PointerEvent<HTMLElement>): void => finish(edge, event),
        onPointerCancel: cancel,
    });

    return { active, handlers };
}
