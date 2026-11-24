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
import { NAV_SECTIONS, VIDEOS_PATH, getSectionState } from "#/modules/shell/model/nav-sections";
import { SectionTabLink } from "#/modules/shell/ui/components/section-tab-link";

function findVideosSection(): (typeof NAV_SECTIONS)[number] {
    const section = NAV_SECTIONS.find((candidate) => candidate.path === VIDEOS_PATH);

    if (section === undefined) {
        throw new Error("The navigation has no Vídeos section");
    }

    return section;
}

function VideosTab(): ReactNode {
    const section = findVideosSection();
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
    const rootRoute = createRootRoute({ component: VideosTab });
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
        await renderAt("/videos?sort=newest");

        const link = await screen.findByRole("link", { name: "Vídeos" });

        expect(link.getAttribute("aria-current")).toBe("page");
    });

    it("does not mark the section as the current page on a page under it", async () => {
        await renderAt("/videos/abc");

        const link = await screen.findByRole("link", { name: "Vídeos" });

        expect(link.getAttribute("aria-current")).toBeNull();
    });
});
