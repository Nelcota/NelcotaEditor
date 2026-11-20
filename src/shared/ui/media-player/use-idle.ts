import { useEffect, useRef, useState } from "react";

// Long enough to reach a control after the mouse stops, short enough to clear the picture quickly.
const IDLE_DELAY_MILLISECONDS = 2500;

interface Idle {
    isIdle: boolean;
    wake: () => void;
}

/** While active (the video playing), turns idle once nothing has happened for a moment. */
export function useIdle(isActive: boolean): Idle {
    const [hasTimedOut, setHasTimedOut] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            const timer = timerRef.current;

            if (timer !== null) {
                window.clearTimeout(timer);
            }
        };
    }, []);

    const wake = (): void => {
        const timer = timerRef.current;

        if (timer !== null) {
            window.clearTimeout(timer);
        }

        setHasTimedOut(false);
        timerRef.current = window.setTimeout(() => setHasTimedOut(true), IDLE_DELAY_MILLISECONDS);
    };

    return { isIdle: isActive && hasTimedOut, wake };
}
