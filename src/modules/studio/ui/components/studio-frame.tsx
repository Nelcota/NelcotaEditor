import type { ReactNode } from "react";
import { StudioBackLink } from "#/modules/studio/ui/components/studio-back-link";

interface StudioFrameProps {
    videoId: string;
    clipId: string | undefined;
    children: ReactNode;
}

/**
 * The editor's window before the workspace can open (loading, not ready, failed): the way back
 * and the page's heading, since the Studio has no page header around it.
 */
export function StudioFrame({ videoId, clipId, children }: StudioFrameProps): ReactNode {
    return (
        <div className="@container/studio grid min-h-full grid-rows-[auto_minmax(0,1fr)]">
            <header className="flex h-15 items-center gap-3 border-b px-2 @2xl/studio:px-4">
                <StudioBackLink videoId={videoId} clipId={clipId} />
                <h1 className="text-base font-semibold">Studio</h1>
            </header>
            <div className="grid content-center p-4">{children}</div>
        </div>
    );
}
