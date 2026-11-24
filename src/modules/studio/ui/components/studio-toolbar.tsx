import CloudCheckIcon from "~icons/lucide/cloud-check";
import CloudOffIcon from "~icons/lucide/cloud-off";
import KeyboardIcon from "~icons/lucide/keyboard";
import Undo2Icon from "~icons/lucide/undo-2";
import Redo2Icon from "~icons/lucide/redo-2";
import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { pluralize } from "#/shared/ui/pluralize";
import type { SaveStatus } from "#/modules/studio/ui/hooks/use-draft-autosave";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { cn } from "#/shared/ui/cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";

const SAVE_LABELS: Record<SaveStatus, string> = {
    saved: "Rascunho salvo",
    saving: "Salvando rascunho…",
    failed: "Rascunho não salvo",
    offline: "Salvo no navegador",
    conflict: "Mudou em outra aba",
};

const SHORTCUTS_LABEL =
    "Espaço toca · J e L voltam e avançam 5 s · [ e ] marcam início e fim · Ctrl+Z desfaz";

interface StudioToolbarProps {
    rankedClips: Array<ClipView>;
    clipId: string;
    onSelectClip: (clipId: string) => void;
    editor: StudioEditor;
    /** Brasa is rendering this video, so nothing can be edited or sent. */
    isRendering: boolean;
    /** The steps, beside the clip on wide screens and on a row of their own on phones. */
    stepper: ReactNode;
}

function SaveState({ editor }: { editor: StudioEditor }): ReactNode {
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
            {SAVE_LABELS[status]}
            {status === "failed" && (
                <button
                    type="button"
                    onClick={async () => {
                        await editor.autosave.flush();
                    }}
                    className="rounded font-medium underline underline-offset-2 outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
                >
                    Tentar de novo
                </button>
            )}
        </span>
    );
}

function ChangeCount({ changeCount }: { changeCount: number }): ReactNode {
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap before:size-2 before:rounded-full before:bg-primary">
            {changeCount} {pluralize(changeCount, "alteração", "alterações")}
            <span className="sr-only">
                {pluralize(changeCount, "não renderizada", "não renderizadas")}
            </span>
        </span>
    );
}

function HistoryButtons({
    editor,
    isRendering,
}: Pick<StudioToolbarProps, "editor" | "isRendering">) {
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

/** Which clip, the steps, whether the draft is safe and how much is waiting to be rendered. */
export function StudioToolbar(props: StudioToolbarProps): ReactNode {
    const { rankedClips, editor, isRendering } = props;
    const total = rankedClips.length;
    const changeCount = editor.changeCount;

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <Select value={props.clipId} onValueChange={props.onSelectClip}>
                <SelectTrigger
                    aria-label="Corte em edição"
                    className="h-10 min-w-0 flex-1 @4xl/studio:w-64 @4xl/studio:flex-none"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {rankedClips.map((clip, index) => (
                        <SelectItem key={clip.id} value={clip.id}>
                            <span className="text-xs font-semibold text-muted-foreground">
                                {index + 1} DE {total}
                            </span>
                            <span className="truncate">{clip.title}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="order-last w-full @4xl/studio:order-none @4xl/studio:w-auto">
                {props.stepper}
            </div>
            <span className="hidden flex-1 @4xl/studio:block" />
            <div className="flex items-center gap-x-4 @max-4xl/studio:order-last @max-4xl/studio:w-full">
                {isRendering === false && <SaveState editor={editor} />}
                {changeCount > 0 && isRendering === false && (
                    <ChangeCount changeCount={changeCount} />
                )}
            </div>
            <HistoryButtons editor={editor} isRendering={isRendering} />
        </div>
    );
}
