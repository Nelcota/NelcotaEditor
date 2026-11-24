/**
 * A callback ref for the field a person acts on next, right after their own action showed it
 * (opening a dialog, reaching a step). Focus moves only then, never on page load.
 */
export function focusWhenShown(element: HTMLElement | null): void {
    if (element === null) {
        return;
    }

    element.focus();
}
