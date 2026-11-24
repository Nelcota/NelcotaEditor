import { useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

const MAIN_ELEMENT_ID = "main";

/**
 * After a client-side page change, focus moves to the page's `<main>`: otherwise it stays on the
 * sidebar link and a screen reader never hears that a new page opened. Search changes (tabs,
 * filters) keep focus where it is; the first load leaves it to the browser.
 */
export function useFocusMainOnNavigate(): void {
    const pathname = useLocation({ select: (location) => location.pathname });
    const previousPathname = useRef(pathname);

    useEffect(() => {
        if (previousPathname.current === pathname) {
            return;
        }

        previousPathname.current = pathname;
        const main = document.getElementById(MAIN_ELEMENT_ID);

        if (main === null) {
            return;
        }

        main.focus({ preventScroll: true });
    }, [pathname]);
}
