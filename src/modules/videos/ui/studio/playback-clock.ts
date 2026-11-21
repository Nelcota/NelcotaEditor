import { useCallback, useSyncExternalStore } from "react";

/**
 * The preview's current time, outside React state. It changes every frame while playing; storing
 * it in state re-rendered the whole Studio about 60 times a second. Components read a value
 * derived from it (the cue being spoken, the time in tenths) and re-render only when that changes.
 */
export interface PlaybackClock {
    read: () => number;
    write: (seconds: number) => void;
    subscribe: (onChange: () => void) => () => void;
}

export function createPlaybackClock(initialSeconds: number): PlaybackClock {
    let currentSeconds = initialSeconds;
    const listeners = new Set<() => void>();

    return {
        read: () => currentSeconds,
        write: (seconds) => {
            if (seconds === currentSeconds) {
                return;
            }

            currentSeconds = seconds;
            listeners.forEach((listener) => listener());
        },
        subscribe: (onChange) => {
            listeners.add(onChange);
            return () => listeners.delete(onChange);
        },
    };
}

/**
 * A value derived from the clock. `select` must return a primitive (or a stable value), so a frame
 * that changes nothing the component shows does not re-render it.
 */
export function usePlaybackValue<Value>(
    clock: PlaybackClock,
    select: (seconds: number) => Value,
): Value {
    const readSelected = useCallback(() => select(clock.read()), [clock, select]);

    return useSyncExternalStore(clock.subscribe, readSelected, readSelected);
}
