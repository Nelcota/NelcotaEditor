// @vitest-environment happy-dom
import {
    RouterProvider,
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    useLocation,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CLIPS_SECTION, getSectionState } from "#/modules/shell/model/nav-sections";
import { SectionTabLink } from "#/modules/shell/ui/components/section-tab-link";

function ClipsTab(): ReactNode {
    const section = CLIPS_SECTION;
    const pathname = useLocation({ select: (location) => location.pathname });

    return (
        <SectionTabLink
            section={section}
            state={getSectionState(section, pathname)}
            hasActivity={false}
        />
    );
}

async function renderAt(url: string): Promise<void> {
    const rootRoute = createRootRoute({ component: ClipsTab });
    const anyPageRoute = createRoute({ getParentRoute: () => rootRoute, path: "$" });
    const router = createRouter({
        routeTree: rootRoute.addChildren([anyPageRoute]),
        history: createMemoryHistory({ initialEntries: [url] }),
    });
    await router.load();
    render(<RouterProvider router={router} />);
}

afterEach(() => {
    cleanup();
});

describe("SectionTabLink", () => {
    it("marks the section as the current page on its own page", async () => {
        await renderAt("/clips?order=newest");

        const link = await screen.findByRole("link", { name: "Meus cortes" });

        expect(link.getAttribute("aria-current")).toBe("page");
    });

    it("does not mark the section as the current page on a page under it", async () => {
        await renderAt("/videos/abc");

        const link = await screen.findByRole("link", { name: "Meus cortes" });

        expect(link.getAttribute("aria-current")).toBeNull();
    });
});
