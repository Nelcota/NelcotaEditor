import type { ReactNode } from "react";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";

export const RENDER_BLOCKED_HINT_ID = "studio-render-blocked-hint";

interface StudioRenderHintProps {
    editor: StudioEditor;
    isRendering: boolean;
}

function describeBlock({ editor, isRendering }: StudioRenderHintProps): string | null {
    if (isRendering === true) {
        return null;
    }

    if (editor.autosave.status === "offline") {
        return "Sem conexão: dá para renderizar quando a internet voltar.";
    }

    if (editor.changeCount === 0) {
        return "Nada mudou desde a última renderização.";
    }

    return null;
}

/**
 * Why "Renderizar corte" is off, when it is off for a reason the person can act on. Always in the
 * page, even empty, so the button's description never points at nothing; a disabled button takes
 * no focus, so the reason is visible text, not a tooltip. Beside the button on wide screens, on a
 * line of its own under the bar on narrow ones.
 */
export function StudioRenderHint(props: StudioRenderHintProps): ReactNode {
    return (
        <p
            id={RENDER_BLOCKED_HINT_ID}
            className="order-last w-full pb-2 text-xs text-muted-foreground empty:hidden @3xl/studio:order-none @3xl/studio:w-auto @3xl/studio:pb-0 @3xl/studio:text-sm"
        >
            {describeBlock(props)}
        </p>
    );
}
