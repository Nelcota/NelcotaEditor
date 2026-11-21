import { useSyncExternalStore } from "react";

export type PhysicalSide = "left" | "right";

const RTL_DIRECTION = "rtl";

function readInlineEndSide(): PhysicalSide {
    if (getComputedStyle(document.documentElement).direction === RTL_DIRECTION) {
        return "left";
    }

    return "right";
}

// The server has no document; left-to-right until the browser says otherwise.
function readServerInlineEndSide(): PhysicalSide {
    return "right";
}

function subscribeToDirection(onChange: () => void): () => void {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributeFilter: ["dir"] });

    return () => observer.disconnect();
}

/**
 * Radix positions popovers by physical side only, so anything that opens past the trailing edge
 * (out of the sidebar, for example) asks here which side that is for the page's text direction.
 */
export function useInlineEndSide(): PhysicalSide {
    return useSyncExternalStore(subscribeToDirection, readInlineEndSide, readServerInlineEndSide);
}
