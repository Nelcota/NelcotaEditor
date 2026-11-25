import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { useMascotAnimations } from "#/shared/ui/use-mascot-animations";

function subscribeToVisibility(onChange: () => void): () => void {
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
}

function isDocumentHidden(): boolean {
    return document.hidden;
}

function isHiddenOnServer(): boolean {
    return true;
}

export function MascotAnimationScope({ children }: { children: ReactNode }): ReactNode {
    const { isEnabled } = useMascotAnimations();
    const isPaused = useSyncExternalStore(
        subscribeToVisibility,
        isDocumentHidden,
        isHiddenOnServer,
    );

    return (
        <div className="contents" data-mascot-animations={isEnabled} data-mascot-paused={isPaused}>
            {children}
        </div>
    );
}
