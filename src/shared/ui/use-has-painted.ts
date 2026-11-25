import { useEffect, useState } from "react";

/**
 * False until the first frame after mount. Transitions gated on it skip the jump from the
 * server's render to a preference stored in the browser, and run only for later changes.
 */
export function useHasPainted(): boolean {
    const [hasPainted, setHasPainted] = useState(false);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => setHasPainted(true));

        return () => window.cancelAnimationFrame(frame);
    }, []);

    return hasPainted;
}
