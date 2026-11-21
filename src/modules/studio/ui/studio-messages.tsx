import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/clip-view";
import {
    OfflineNotice,
    RenderFailedBanner,
    RenderedNotice,
} from "#/modules/studio/ui/studio-notices";
import type { StudioEditor } from "#/modules/studio/ui/use-studio-editor";

/** True once a render this page started (or watched) has just finished. */
function useJustRendered(isRendering: boolean): boolean {
    const wasRenderingRef = useRef(isRendering);
    const [hasFinished, setHasFinished] = useState(false);

    useEffect(() => {
        if (wasRenderingRef.current === true && isRendering === false) {
            setHasFinished(true);
        }

        wasRenderingRef.current = isRendering;
    }, [isRendering]);

    return hasFinished;
}

interface StudioMessagesProps {
    videoId: string;
    clip: ClipView;
    editor: StudioEditor;
    isRendering: boolean;
}

/** What the Studio has to tell above the toolbar: render outcome, connection and refused edits. */
export function StudioMessages({
    videoId,
    clip,
    editor,
    isRendering,
}: StudioMessagesProps): ReactNode {
    const hasJustRendered = useJustRendered(isRendering);

    return (
        <>
            {clip.status === "failed" && isRendering === false && (
                <RenderFailedBanner videoId={videoId} clip={clip} />
            )}
            {hasJustRendered === true && clip.status === "done" && <RenderedNotice clip={clip} />}
            {editor.autosave.status === "offline" && <OfflineNotice />}
            {editor.renderError !== null && (
                <p role="alert" className="text-sm text-destructive">
                    {editor.renderError}
                </p>
            )}
            {editor.editError !== null && (
                <p role="alert" className="text-sm text-destructive">
                    {editor.editError}
                </p>
            )}
        </>
    );
}
