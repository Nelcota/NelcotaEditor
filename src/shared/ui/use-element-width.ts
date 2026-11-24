import { useSyncExternalStore } from "react";

const NOT_MEASURED = -1;

function readServerSnapshot(): number {
    return NOT_MEASURED;
}

function ignoreUnsubscribe(): void {
    return;
}

/** The element's inner width in pixels, kept in sync as it resizes; null until it is measured. */
export function useElementWidth(element: HTMLElement | null): number | null {
    // Stable per element: a new subscribe function would resubscribe on every render.
    const subscribe = (onChange: () => void): (() => void) => {
        if (element === null) {
            return ignoreUnsubscribe;
        }

        const observer = new ResizeObserver(onChange);
        observer.observe(element);
        return () => observer.disconnect();
    };
    const readSnapshot = (): number => {
        if (element === null) {
            return NOT_MEASURED;
        }

        return element.clientWidth;
    };
    const width = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);

    if (width === NOT_MEASURED) {
        return null;
    }

    return width;
}
