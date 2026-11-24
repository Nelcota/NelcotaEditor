import CloudCheckIcon from "~icons/lucide/cloud-check";
import CloudOffIcon from "~icons/lucide/cloud-off";
import KeyboardIcon from "~icons/lucide/keyboard";
import Undo2Icon from "~icons/lucide/undo-2";
import Redo2Icon from "~icons/lucide/redo-2";
import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/model/clip-view";
import type { SaveStatus } from "#/modules/studio/ui/hooks/use-draft-autosave";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";
import { StudioBackLink } from "#/modules/studio/ui/components/studio-back-link";
import { StudioClipSwitcher } from "#/modules/studio/ui/components/studio-clip-switcher";
import { StudioRenderButton } from "#/modules/studio/ui/components/studio-render-button";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { cn } from "#/shared/ui/cn";
import { pluralize } from "#/shared/ui/pluralize";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

const SAVE_LABELS: Record<SaveStatus, string> = {
    saved: "Rascunho salvo",
    saving: "Salvando rascunho…",
    failed: "Rascunho não salvo",
    offline: "Salvo no navegador",
    conflict: "Mudou em outra aba",
};

const SHORTCUTS_LABEL =
    "Espaço toca · J e L voltam e avançam 5 s · [ e ] marcam início e fim · Ctrl+Z desfaz";

interface StudioBarProps {
    videoId: string;
    rankedClips: Array<ClipView>;
    clipId: string;
    onSelectClip: (clipId: string) => void;
    editor: StudioEditor;
    /** Brasa is rendering this video, so nothing can be edited or sent. */
    isRendering: boolean;
    onRender: () => void;
}

function SaveState({ editor }: { editor: StudioEditor }): ReactNode {
    const track = useTrackPromise();
    const status = editor.autosave.status;
    let Icon = CloudCheckIcon;

    if (status === "failed" || status === "offline") {
        Icon = CloudOffIcon;
    }

    return (
        <span
            role="status"
            className={cn(
                "inline-flex items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground",
                status === "failed" && "text-destructive",
            )}
        >
            <Icon className="size-4" aria-hidden="true" />
            <span className="@max-3xl/studio:sr-only">{SAVE_LABELS[status]}</span>
            {status === "failed" && (
                <button
                    type="button"
                    onClick={() => track(editor.autosave.flush())}
                    className="rounded font-medium underline underline-offset-2 outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
                >
                    Tentar de novo
                </button>
            )}
        </span>
    );
}

/** How much the file is behind the draft; "Nada mudou" says why Renderizar is off. */
function ChangeCount({ changeCount }: { changeCount: number }): ReactNode {
    if (changeCount === 0) {
        return (
            <span className="text-sm whitespace-nowrap text-muted-foreground @max-5xl/studio:hidden">
                Nada mudou
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap before:size-2 before:rounded-full before:bg-primary @max-3xl/studio:hidden">
            {changeCount} {pluralize(changeCount, "alteração", "alterações")}
            <span className="sr-only">
                {pluralize(changeCount, "não renderizada", "não renderizadas")}
            </span>
        </span>
    );
}

function HistoryButtons({ editor, isRendering }: Pick<StudioBarProps, "editor" | "isRendering">) {
    return (
        <div className="flex items-center">
            <HintTooltip label="Desfazer" shortcut="Ctrl+Z">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Desfazer"
                    aria-keyshortcuts="Control+Z"
                    disabled={editor.canUndo === false || isRendering === true}
                    onClick={editor.undo}
                >
                    <Undo2Icon aria-hidden="true" />
                </Button>
            </HintTooltip>
            <HintTooltip label="Refazer" shortcut="Ctrl+Shift+Z">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Refazer"
                    aria-keyshortcuts="Control+Shift+Z"
                    disabled={editor.canRedo === false || isRendering === true}
                    onClick={editor.redo}
                    className="max-sm:hidden"
                >
                    <Redo2Icon aria-hidden="true" />
                </Button>
            </HintTooltip>
            {/* Phones have no keyboard to use them with. */}
            <HintTooltip label={SHORTCUTS_LABEL}>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Atalhos de teclado"
                    className="hidden @4xl/studio:inline-flex"
                >
                    <KeyboardIcon aria-hidden="true" />
                </Button>
            </HintTooltip>
        </div>
    );
}

/** The editor's only bar: the way back, which clip, whether the draft is safe, and Renderizar. */
export function StudioBar(props: StudioBarProps): ReactNode {
    const { editor, isRendering } = props;

    return (
        <header className="flex h-15 items-center gap-2 border-b bg-background px-2 @2xl/studio:gap-3 @2xl/studio:px-4">
            <StudioBackLink videoId={props.videoId} clipId={props.clipId} />
            <span aria-hidden="true" className="h-6 w-px bg-border max-sm:hidden" />
            <StudioClipSwitcher
                rankedClips={props.rankedClips}
                clipId={props.clipId}
                onSelectClip={props.onSelectClip}
            />
            <span className="flex-1" />
            {isRendering === false && <SaveState editor={editor} />}
            {isRendering === false && <ChangeCount changeCount={editor.changeCount} />}
            <HistoryButtons editor={editor} isRendering={isRendering} />
            <StudioRenderButton
                editor={editor}
                isRendering={isRendering}
                onRender={props.onRender}
            />
        </header>
    );
}
