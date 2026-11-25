import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/model/clip-view";
import {
    OfflineNotice,
    RenderFailedBanner,
    RenderedNotice,
} from "#/modules/studio/ui/components/studio-notices";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";

interface JustRendered {
    /** A render this page started (or watched) has just finished, and the notice is still up. */
    isShown: boolean;
    dismiss: () => void;
}

function useJustRendered(isRendering: boolean): JustRendered {
    const wasRenderingRef = useRef(isRendering);
    const [hasFinished, setHasFinished] = useState(false);

    useEffect(() => {
        if (wasRenderingRef.current === false && isRendering === true) {
            setHasFinished(false);
        }

        if (wasRenderingRef.current === true && isRendering === false) {
            setHasFinished(true);
        }

        wasRenderingRef.current = isRendering;
    }, [isRendering]);

    return { isShown: hasFinished, dismiss: () => setHasFinished(false) };
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
    const justRendered = useJustRendered(isRendering);

    return (
        <>
            {clip.status === "failed" && isRendering === false && (
                <RenderFailedBanner videoId={videoId} clip={clip} />
            )}
            {justRendered.isShown === true && clip.status === "done" && (
                <RenderedNotice clip={clip} onDismiss={justRendered.dismiss} />
            )}
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
