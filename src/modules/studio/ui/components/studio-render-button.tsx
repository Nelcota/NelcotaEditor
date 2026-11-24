import ClapperboardIcon from "~icons/lucide/clapperboard";
import type { ReactNode } from "react";
import { RENDER_BLOCKED_HINT_ID } from "#/modules/studio/ui/components/studio-render-hint";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";
import { Button } from "#/shared/ui/button";

interface StudioRenderButtonProps {
    editor: StudioEditor;
    /** Brasa is rendering this video, so nothing can be sent. */
    isRendering: boolean;
    onRender: () => void;
}

function RenderLabel({
    editor,
    isRendering,
}: Omit<StudioRenderButtonProps, "onRender">): ReactNode {
    if (editor.isSendingRender === true) {
        return "Enviando…";
    }

    if (isRendering === true) {
        return "Renderizando…";
    }

    // On a phone the bar also holds the clip's title, which needs the room more.
    return (
        <>
            Renderizar<span className="max-sm:hidden"> corte</span>
        </>
    );
}

/** The editor's one main action, in the bar so it never scrolls away. */
export function StudioRenderButton(props: StudioRenderButtonProps): ReactNode {
    const { editor, isRendering, onRender } = props;
    const isBusy = isRendering === true || editor.isSendingRender === true;

    return (
        <Button
            className="font-semibold max-sm:px-3"
            disabled={
                editor.changeCount === 0 || isBusy === true || editor.autosave.status === "offline"
            }
            aria-busy={isBusy}
            aria-describedby={RENDER_BLOCKED_HINT_ID}
            onClick={onRender}
        >
            <ClapperboardIcon aria-hidden="true" className="max-sm:hidden" />
            <RenderLabel editor={editor} isRendering={isRendering} />
        </Button>
    );
}
