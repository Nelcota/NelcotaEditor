import CloudCheckIcon from "~icons/solar/cloud-check-linear";
import CloudCrossIcon from "~icons/solar/cloud-cross-linear";
import ClapperboardPlayIcon from "~icons/solar/clapperboard-play-linear";
import UndoLeftIcon from "~icons/solar/undo-left-linear";
import UndoRightIcon from "~icons/solar/undo-right-linear";
import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/clip-view";
import { pluralize } from "#/shared/ui/pluralize";
import type { SaveStatus } from "#/modules/studio/ui/use-draft-autosave";
import type { StudioEditor } from "#/modules/studio/ui/use-studio-editor";
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

interface StudioToolbarProps {
    rankedClips: Array<ClipView>;
    clipId: string;
    onSelectClip: (clipId: string) => void;
    editor: StudioEditor;
    /** Brasa is rendering this video, so nothing can be edited or sent. */
    isRendering: boolean;
    onRender: () => void;
}

function SaveState({ editor }: { editor: StudioEditor }): ReactNode {
    const status = editor.autosave.status;
    let Icon = CloudCheckIcon;

    if (status === "failed" || status === "offline") {
        Icon = CloudCrossIcon;
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
                    className="rounded font-medium underline underline-offset-2 outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]"
                >
                    Tentar de novo
                </button>
            )}
        </span>
    );
}

function RenderButton(props: Pick<StudioToolbarProps, "editor" | "isRendering" | "onRender">) {
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
            className="min-w-48 font-semibold max-sm:w-full"
            disabled={
                editor.changeCount === 0 ||
                isRendering === true ||
                editor.isSendingRender === true ||
                editor.autosave.status === "offline"
            }
            aria-busy={isRendering === true || editor.isSendingRender === true}
            onClick={props.onRender}
        >
            <ClapperboardPlayIcon aria-hidden="true" />
            {label}
        </Button>
    );
}

/** Which clip, undo and redo, whether the draft is safe, and the one main action. */
export function StudioToolbar(props: StudioToolbarProps): ReactNode {
    const { rankedClips, editor, isRendering } = props;
    const total = rankedClips.length;
    const changeCount = editor.changeCount;

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Select value={props.clipId} onValueChange={props.onSelectClip}>
                <SelectTrigger
                    aria-label="Corte em edição"
                    className="h-10 min-w-0 flex-1 sm:w-80 sm:flex-none"
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
            <HintTooltip label="Desfazer" shortcut="Ctrl+Z">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Desfazer"
                    aria-keyshortcuts="Control+Z"
                    disabled={editor.canUndo === false || isRendering === true}
                    onClick={editor.undo}
                >
                    <UndoLeftIcon aria-hidden="true" />
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
                    <UndoRightIcon aria-hidden="true" />
                </Button>
            </HintTooltip>
            <span className="flex-1" />
            {isRendering === false && <SaveState editor={editor} />}
            {changeCount > 0 && isRendering === false && (
                <span className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap before:size-2 before:rounded-full before:bg-primary">
                    {changeCount}{" "}
                    {pluralize(
                        changeCount,
                        "alteração não renderizada",
                        "alterações não renderizadas",
                    )}
                </span>
            )}
            <RenderButton editor={editor} isRendering={isRendering} onRender={props.onRender} />
        </div>
    );
}
