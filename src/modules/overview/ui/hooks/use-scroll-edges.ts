import { useEffect, useState } from "react";
import type { RefObject } from "react";

/** A pixel of slack, since fractional scroll positions never land exactly on the edge. */
const EDGE_TOLERANCE_PIXELS = 1;

interface ScrollEdges {
    canScrollBack: boolean;
    canScrollForward: boolean;
}

function measureEdges(scroller: HTMLElement): ScrollEdges {
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;

    return {
        canScrollBack: scroller.scrollLeft > EDGE_TOLERANCE_PIXELS,
        canScrollForward: scroller.scrollLeft < maxScroll - EDGE_TOLERANCE_PIXELS,
    };
}

/** Tracks whether a horizontal scroller can still move back or forward. */
export function useScrollEdges(scrollerRef: RefObject<HTMLElement | null>): ScrollEdges {
    const [edges, setEdges] = useState<ScrollEdges>({
        canScrollBack: false,
        canScrollForward: false,
    });

    useEffect(() => {
        const scroller = scrollerRef.current;

        if (scroller === null) {
            return undefined;
        }

        const measure = (): void => setEdges(measureEdges(scroller));
        measure();
        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(scroller);
        scroller.addEventListener("scroll", measure, { passive: true });

        return () => {
            resizeObserver.disconnect();
            scroller.removeEventListener("scroll", measure);
        };
    }, [scrollerRef]);

    return edges;
}
