import { useCallback, useSyncExternalStore } from "react";

function readServerSnapshot(): boolean {
    return false;
}

/**
 * Whether a CSS media query matches, kept in sync as the window changes. False on the server and
 * on the first client render, so content that only desktops need is not fetched on phones.
 */
export function useMediaQuery(query: string): boolean {
    // Stable per query: a new subscribe function would resubscribe on every render.
    const subscribe = useCallback(
        (onChange: () => void): (() => void) => {
            const mediaQueryList = window.matchMedia(query);
            mediaQueryList.addEventListener("change", onChange);
            return () => mediaQueryList.removeEventListener("change", onChange);
        },
        [query],
    );
    const readSnapshot = useCallback((): boolean => window.matchMedia(query).matches, [query]);

    return useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
}
