// @vitest-environment happy-dom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFocusMainOnNavigate } from "#/modules/shell/ui/hooks/use-focus-main-on-navigate";

const location = { pathname: "/overview" };

vi.mock("@tanstack/react-router", () => ({
    useLocation: ({ select }: { select: (current: { pathname: string }) => string }) =>
        select(location),
}));

function mountShell(): {
    shell: HTMLDivElement;
    main: HTMLElement;
    dialogButton: HTMLButtonElement;
} {
    const shell = document.createElement("div");
    const main = document.createElement("main");
    main.id = "main";
    main.tabIndex = -1;
    shell.append(main);
    const dialogButton = document.createElement("button");
    document.body.append(shell, dialogButton);

    return { shell, main, dialogButton };
}

afterEach(() => {
    cleanup();
    document.body.replaceChildren();
    location.pathname = "/overview";
});

describe("useFocusMainOnNavigate", () => {
    it("focuses the page content after the path changes", () => {
        const { main } = mountShell();
        const { rerender } = renderHook(() => useFocusMainOnNavigate(false));

        location.pathname = "/videos";
        rerender();

        expect(document.activeElement).toBe(main);
    });

    it("leaves focus in a modal that the same navigation opened", () => {
        const { shell, dialogButton } = mountShell();
        const { rerender } = renderHook(() => useFocusMainOnNavigate(false));

        shell.setAttribute("aria-hidden", "true");
        dialogButton.focus();
        location.pathname = "/videos";
        rerender();

        expect(document.activeElement).toBe(dialogButton);
    });
});
