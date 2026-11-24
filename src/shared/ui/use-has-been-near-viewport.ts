import { useEffect, useState } from "react";
import type { RefObject } from "react";

// Starts a little before the element scrolls in, so its first frame is usually ready on arrival.
const LOOK_AHEAD_MARGIN = "400px";

/**
 * True once the element has come near the viewport, and stays true. Lists use it to start
 * loading media only for the rows someone can actually reach, not all of them at once.
 */
export function useHasBeenNearViewport(elementRef: RefObject<Element | null>): boolean {
    const [hasBeenNear, setHasBeenNear] = useState(false);

    useEffect(() => {
        const element = elementRef.current;

        if (element === null || hasBeenNear === true) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting === true) === false) {
                    return;
                }

                setHasBeenNear(true);
                observer.disconnect();
            },
            { rootMargin: LOOK_AHEAD_MARGIN },
        );
        observer.observe(element);

        return () => observer.disconnect();
    }, [elementRef, hasBeenNear]);

    return hasBeenNear;
}
