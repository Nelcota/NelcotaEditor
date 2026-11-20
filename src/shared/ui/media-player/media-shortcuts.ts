import type { KeyboardEvent } from "react";

const SHORT_SKIP_SECONDS = 5;
const LONG_SKIP_SECONDS = 10;

export interface ShortcutActions {
    togglePlay: () => Promise<void>;
    seekBy: (deltaSeconds: number) => void;
    toggleMute: () => void;
    toggleFullscreen: () => Promise<void>;
}

type ShortcutAction = (actions: ShortcutActions) => Promise<void> | void;

/** The same keys as the big video sites, so nobody has to learn new ones. */
const KEY_ACTIONS = new Map<string, ShortcutAction>([
    [" ", (actions) => actions.togglePlay()],
    ["k", (actions) => actions.togglePlay()],
    ["arrowleft", (actions) => actions.seekBy(-SHORT_SKIP_SECONDS)],
    ["arrowright", (actions) => actions.seekBy(SHORT_SKIP_SECONDS)],
    ["j", (actions) => actions.seekBy(-LONG_SKIP_SECONDS)],
    ["l", (actions) => actions.seekBy(LONG_SKIP_SECONDS)],
    ["m", (actions) => actions.toggleMute()],
    ["f", (actions) => actions.toggleFullscreen()],
]);

/** Buttons and sliders already use these keys themselves (press, move the slider). */
const KEYS_OWNED_BY_CONTROLS = new Set([" ", "arrowleft", "arrowright"]);

export async function handleMediaShortcut(
    event: KeyboardEvent<HTMLElement>,
    actions: ShortcutActions,
): Promise<void> {
    const key = event.key.toLowerCase();
    const target = event.target;
    const action = KEY_ACTIONS.get(key);

    if (action === undefined || event.altKey === true || event.ctrlKey === true) {
        return;
    }

    if (event.metaKey === true) {
        return;
    }

    if (
        KEYS_OWNED_BY_CONTROLS.has(key) === true &&
        (target instanceof HTMLInputElement || target instanceof HTMLButtonElement)
    ) {
        return;
    }

    event.preventDefault();
    await action(actions);
}
