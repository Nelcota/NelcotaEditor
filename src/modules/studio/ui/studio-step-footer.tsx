import ChevronLeftIcon from "~icons/lucide/chevron-left";
import ChevronRightIcon from "~icons/lucide/chevron-right";
import ClapperboardIcon from "~icons/lucide/clapperboard";
import type { ReactNode } from "react";
import { STUDIO_STEP_LABELS, findNeighbourSteps } from "#/modules/studio/ui/studio-steps";
import type { StudioStep } from "#/modules/studio/ui/studio-steps";
import type { StudioEditor } from "#/modules/studio/ui/use-studio-editor";
import { Button } from "#/shared/ui/button";

interface StudioStepFooterProps {
    step: StudioStep;
    onStepChange: (step: StudioStep) => void;
    editor: StudioEditor;
    /** Brasa is rendering this video, so nothing can be sent. */
    isRendering: boolean;
    onRender: () => void;
}

function RenderButton(props: Omit<StudioStepFooterProps, "step" | "onStepChange">): ReactNode {
    const { editor, isRendering } = props;
    let label = "Renderizar corte";

    if (isRendering === true) {
        label = "Renderizando…";
    }

    if (editor.isSendingRender === true) {
        label = "Enviando…";
    }

    return (
        <Button
            className="font-semibold max-sm:w-full"
            disabled={
                editor.changeCount === 0 ||
                isRendering === true ||
                editor.isSendingRender === true ||
                editor.autosave.status === "offline"
            }
            aria-busy={isRendering === true || editor.isSendingRender === true}
            onClick={props.onRender}
        >
            <ClapperboardIcon aria-hidden="true" />
            {label}
        </Button>
    );
}

/**
 * Back and forward through the steps, and the one main action. Rendering is offered on every
 * step: a trim alone is reason enough to send the clip again.
 */
export function StudioStepFooter(props: StudioStepFooterProps): ReactNode {
    const { step, onStepChange } = props;
    const { previous, next } = findNeighbourSteps(step);

    return (
        <div className="flex flex-wrap items-center gap-2 border-t p-4 @4xl/studio:px-6">
            {previous !== undefined && (
                <Button variant="outline" onClick={() => onStepChange(previous)}>
                    <ChevronLeftIcon aria-hidden="true" />
                    {STUDIO_STEP_LABELS[previous]}
                </Button>
            )}
            <span className="flex-1" />
            {next !== undefined && (
                <Button variant="outline" onClick={() => onStepChange(next)}>
                    {STUDIO_STEP_LABELS[next]}
                    <ChevronRightIcon aria-hidden="true" />
                </Button>
            )}
            <RenderButton
                editor={props.editor}
                isRendering={props.isRendering}
                onRender={props.onRender}
            />
            <RenderBlockedHint editor={props.editor} isRendering={props.isRendering} />
        </div>
    );
}

/** Why "Renderizar corte" is off, when it is off for a reason the person can act on. */
function RenderBlockedHint({
    editor,
    isRendering,
}: Pick<StudioStepFooterProps, "editor" | "isRendering">) {
    if (isRendering === true) {
        return null;
    }

    if (editor.autosave.status === "offline") {
        return (
            <p className="w-full text-end text-xs text-muted-foreground">
                Sem conexão: dá para renderizar quando a internet voltar.
            </p>
        );
    }

    if (editor.changeCount === 0) {
        return (
            <p className="w-full text-end text-xs text-muted-foreground">
                Nada mudou desde a última renderização.
            </p>
        );
    }

    return null;
}
