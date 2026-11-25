import { useBlocker } from "@tanstack/react-router";
import { useRef } from "react";

const LEAVE_QUESTION = "Sair sem enviar? O que você escreveu será perdido.";

/**
 * Asks before leaving a form that has text in it, inside the app and when the tab closes. Call
 * the returned function right before a navigation that follows a successful submit.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean): () => void {
    const isLeaveAllowedRef = useRef(false);

    useBlocker({
        shouldBlockFn: () => {
            if (hasUnsavedChanges === false || isLeaveAllowedRef.current === true) {
                return false;
            }

            return window.confirm(LEAVE_QUESTION) === false;
        },
        enableBeforeUnload: () => hasUnsavedChanges === true && isLeaveAllowedRef.current === false,
    });

    return (): void => {
        isLeaveAllowedRef.current = true;
    };
}
