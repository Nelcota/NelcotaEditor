import { useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

const MAIN_ELEMENT_ID = "main";

/**
 * After a client-side page change, focus moves to the page's `<main>`: otherwise it stays on the
 * sidebar link and a screen reader never hears that a new page opened. Search changes (tabs,
 * filters) keep focus where it is, except when they swap the whole window's layout (the Studio),
 * which removes the focused element; the first load leaves it to the browser.
 */
export function useFocusMainOnNavigate(isFocusLayout: boolean): void {
    const pathname = useLocation({ select: (location) => location.pathname });
    const page = `${pathname}|${String(isFocusLayout)}`;
    const previousPage = useRef(page);

    useEffect(() => {
        if (previousPage.current === page) {
            return;
        }

        previousPage.current = page;
        const main = document.getElementById(MAIN_ELEMENT_ID);

        if (main === null) {
            return;
        }

        main.focus({ preventScroll: true });
    }, [page]);
}
