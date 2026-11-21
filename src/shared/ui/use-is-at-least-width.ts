import { useCallback, useSyncExternalStore } from "react";

function readServerSnapshot(): boolean {
    return false;
}

function ignoreUnsubscribe(): void {
    return;
}

/**
 * Whether an element is at least this wide, kept in sync as it resizes. The JavaScript twin of a
 * container query: false on the server and until the element mounts.
 */
export function useIsAtLeastWidth(element: HTMLElement | null, minWidthPixels: number): boolean {
    if (Number.isFinite(minWidthPixels) === false || minWidthPixels < 0) {
        throw new RangeError(`Minimum width must be a non-negative number, got ${minWidthPixels}`);
    }

    // Stable per element: a new subscribe function would resubscribe on every render.
    const subscribe = useCallback(
        (onChange: () => void): (() => void) => {
            if (element === null) {
                return ignoreUnsubscribe;
            }

            const observer = new ResizeObserver(onChange);
            observer.observe(element);
            return () => observer.disconnect();
        },
        [element],
    );
    const readSnapshot = useCallback((): boolean => {
        if (element === null) {
            return false;
        }

        return element.clientWidth >= minWidthPixels;
    }, [element, minWidthPixels]);

    return useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
}
