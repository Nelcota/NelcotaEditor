// @vitest-environment happy-dom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useStudioShortcuts } from "#/modules/studio/ui/hooks/use-studio-shortcuts";
import type { StudioShortcutActions } from "#/modules/studio/ui/hooks/use-studio-shortcuts";

function createActions(): StudioShortcutActions {
    return {
        togglePlay: vi.fn(),
        skip: vi.fn(),
        markStart: vi.fn(),
        markEnd: vi.fn(),
        undo: vi.fn(),
        redo: vi.fn(),
    };
}

function pressKey(init: KeyboardEventInit): void {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
}

afterEach(() => {
    cleanup();
    document.body.replaceChildren();
});

describe("useStudioShortcuts", () => {
    it("moves the preview with a key on the page", () => {
        const actions = createActions();
        renderHook(() => useStudioShortcuts(actions, true));

        pressKey({ key: "l" });

        expect(actions.skip).toHaveBeenCalledWith(5);
    });

    it("leaves the editor alone while a modal dialog is open", () => {
        const actions = createActions();
        const dialog = document.createElement("div");
        dialog.setAttribute("role", "alertdialog");
        dialog.dataset.state = "open";
        document.body.append(dialog);
        renderHook(() => useStudioShortcuts(actions, true));

        pressKey({ key: "z", ctrlKey: true });
        pressKey({ key: "l" });

        expect(actions.undo).not.toHaveBeenCalled();
        expect(actions.skip).not.toHaveBeenCalled();
    });
});
