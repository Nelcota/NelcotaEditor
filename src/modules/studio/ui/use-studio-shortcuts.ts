import { useEffect, useRef } from "react";

const SKIP_SECONDS = 5;

export interface StudioShortcutActions {
    togglePlay: () => Promise<void>;
    skip: (deltaSeconds: number) => void;
    markStart: () => void;
    markEnd: () => void;
    undo: () => void;
    redo: () => void;
}

// Controls whose own keys (Space, arrows) must keep working while they have focus.
const FOCUSED_CONTROL_SELECTOR =
    "button, a[href], summary, [role=slider], [role=radio], [role=combobox], [role=tab]";

/** Typing in a field must never play the video or move the clip. */
function isTypingTarget(target: EventTarget | null): boolean {
    if (target instanceof HTMLElement === false) {
        return false;
    }

    return (
        target.isContentEditable === true ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
    );
}

/** A focused button, slider or radio keeps its own Space and letters; Ctrl+Z still undoes. */
function isFocusedControl(target: EventTarget | null): boolean {
    if (target instanceof HTMLElement === false) {
        return false;
    }

    return target.closest(FOCUSED_CONTROL_SELECTOR) !== null;
}

function isCommandKey(event: KeyboardEvent): boolean {
    return event.ctrlKey === true || event.metaKey === true;
}

function runShortcut(event: KeyboardEvent, actions: StudioShortcutActions): boolean {
    const key = event.key.toLowerCase();

    if (isCommandKey(event) === true && key === "z" && event.shiftKey === true) {
        actions.redo();
        return true;
    }

    if (isCommandKey(event) === true && key === "z") {
        actions.undo();
        return true;
    }

    if (isCommandKey(event) === true) {
        return false;
    }

    const plainKeys: Record<string, () => void> = {
        j: () => actions.skip(-SKIP_SECONDS),
        l: () => actions.skip(SKIP_SECONDS),
        "[": actions.markStart,
        "]": actions.markEnd,
        " ": () => {
            void actions.togglePlay();
        },
    };
    const action = plainKeys[key];

    if (action === undefined) {
        return false;
    }

    action();
    return true;
}

/** The Studio's keys, active anywhere on the page except while typing. */
export function useStudioShortcuts(actions: StudioShortcutActions, isEnabled: boolean): void {
    const actionsRef = useRef(actions);

    useEffect(() => {
        actionsRef.current = actions;
    });

    useEffect(() => {
        if (isEnabled === false) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent): void => {
            if (isTypingTarget(event.target) === true) {
                return;
            }

            if (isFocusedControl(event.target) === true && isCommandKey(event) === false) {
                return;
            }

            if (runShortcut(event, actionsRef.current) === true) {
                event.preventDefault();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isEnabled]);
}
