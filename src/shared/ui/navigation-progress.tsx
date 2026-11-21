import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * A thin bar at the top while a route loads. It fades in only after a short delay (in CSS), so
 * fast navigations never flash it; slow ones say "working on it" instead of looking stuck.
 */
export function NavigationProgress(): ReactNode {
    const isLoading = useRouterState({ select: (state) => state.status === "pending" });

    if (isLoading === false) {
        return null;
    }

    return (
        <div
            role="progressbar"
            aria-label="Carregando a página"
            className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden opacity-0 animate-[navigation-fade-in_150ms_ease-out_200ms_forwards]"
        >
            <div className="h-full w-1/3 bg-primary motion-safe:animate-[navigation-progress_1.1s_ease-in-out_infinite]" />
        </div>
    );
}
