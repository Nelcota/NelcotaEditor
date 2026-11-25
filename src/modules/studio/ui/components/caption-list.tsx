import RotateCcwIcon from "~icons/lucide/rotate-ccw";
import LocateIcon from "~icons/lucide/locate";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CaptionCue, CaptionWord, StudioDraft } from "#/modules/clips/model/clip-studio";
import { pluralize } from "#/shared/ui/pluralize";
import { canUndoReset, hasCaptionsToReset } from "#/modules/studio/model/caption-reset";
import type { CaptionReset } from "#/modules/studio/model/caption-reset";
import { CueEditor } from "#/modules/studio/ui/components/cue-editor";
import { cueText, resetCue, transcriptWordsOf } from "#/modules/studio/model/cue-editing";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";
import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import { Mascot } from "#/shared/ui/mascot";

interface CaptionListProps {
    editor: StudioEditor;
    words: Array<CaptionWord>;
    /** The cue being spoken; -1 when none. */
    playingIndex: number;
    openIndex: number | null;
    onOpen: (index: number | null) => void;
    onSeek: (seconds: number) => void;
    isLocked: boolean;
    className?: string;
}

function NoSpeech(): ReactNode {
    return (
        <div className="grid justify-items-center gap-2 px-5 py-10 text-center">
            <Mascot index={STAGE_CREW.transcribing} className="size-10" />
            <p className="font-semibold">Nenhuma fala neste trecho</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Não há fala neste trecho. Mude o trecho para incluir fala, ou deixe o corte sem
                legenda.
            </p>
        </div>
    );
}

function CaptionsOffNotice({ editor }: { editor: StudioEditor }): ReactNode {
    return (
        <div className="m-3 flex items-center gap-3 rounded-xl border bg-popover px-3 py-2 text-sm">
            <span className="flex-1">
                Legenda desligada neste corte. O texto continua guardado.
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => editor.updateSettings({ captionStyle: "karaoke" })}
            >
                Ligar
            </Button>
        </div>
    );
}

const RESET_MESSAGES = {
    all: "Todas as legendas voltaram ao texto original.",
    cue: "O bloco voltou ao texto original.",
} as const;

interface LastReset {
    reset: CaptionReset;
    before: StudioDraft;
}

interface CaptionResetControls {
    canResetAll: boolean;
    /** The reset that one undo step can still take back; null when there is none. */
    undoableReset: CaptionReset | null;
    resetAll: () => void;
    resetCueAt: (index: number) => void;
    undoReset: () => void;
}

/** The last reset, while one undo step still brings the person's edits back; null otherwise. */
function findUndoableReset(
    draft: StudioDraft,
    lastReset: LastReset | null,
    words: Array<CaptionWord>,
): CaptionReset | null {
    if (lastReset === null) {
        return null;
    }

    if (canUndoReset(draft, lastReset, words) === false) {
        return null;
    }

    return lastReset.reset;
}

/** "Voltar ao original" throws edits away, so right after it the list offers to take it back. */
function useCaptionReset(editor: StudioEditor, words: Array<CaptionWord>): CaptionResetControls {
    const draft = editor.draft;
    const [lastReset, setLastReset] = useState<LastReset | null>(null);
    const canResetAll = hasCaptionsToReset(draft, words);
    const undoableReset = findUndoableReset(draft, lastReset, words);

    const remember = (reset: CaptionReset): void => {
        setLastReset({ reset, before: draft });
    };

    return {
        canResetAll,
        undoableReset,
        resetAll: () => {
            remember({ scope: "all" });
            editor.resetAllCaptions();
        },
        resetCueAt: (index) => {
            const cue = draft.cues[index];

            if (cue === undefined) {
                return;
            }

            remember({ scope: "cue", index });
            editor.replaceCue(index, [resetCue(cue, words)]);
        },
        undoReset: () => {
            setLastReset(null);
            editor.undo();
        },
    };
}

/** Whether focus sits on nothing: the reset button that had it just became disabled. */
function isFocusLost(): boolean {
    const active = document.activeElement;

    if (active === null || active === document.body) {
        return true;
    }

    return active instanceof HTMLButtonElement && active.disabled === true;
}

function ResetUndoNotice(props: {
    reset: CaptionReset;
    isLocked: boolean;
    onUndo: () => void;
}): ReactNode {
    const undoRef = useRef<HTMLButtonElement>(null);

    // A keyboard user would otherwise be dropped at the top of the page.
    useEffect(() => {
        if (isFocusLost() === true) {
            undoRef.current?.focus();
        }
    }, []);

    return (
        <div className="m-3 flex items-center gap-3 rounded-xl border bg-popover px-3 py-2 text-sm">
            <span className="flex-1">{RESET_MESSAGES[props.reset.scope]}</span>
            <Button
                ref={undoRef}
                variant="outline"
                size="sm"
                className="pointer-coarse:h-11"
                disabled={props.isLocked}
                onClick={props.onUndo}
            >
                Desfazer
            </Button>
        </div>
    );
}

/** Whether the cue now says something other than what Tinta heard in its time. */
function isCueEdited(cue: CaptionCue, words: Array<CaptionWord>): boolean {
    const original = transcriptWordsOf(cue, words);

    if (original.length === 0) {
        return false;
    }

    return cueText({ ...cue, words: original }) !== cueText(cue);
}

/** Positions of the cues whose text differs from the transcript. */
function findEditedCueIndexes(cues: Array<CaptionCue>, words: Array<CaptionWord>): Set<number> {
    const editedIndexes = new Set<number>();

    for (const [index, cue] of cues.entries()) {
        if (isCueEdited(cue, words) === true) {
            editedIndexes.add(index);
        }
    }

    return editedIndexes;
}

/**
 * Every caption of the clip in order. The one being spoken is marked and kept in view while the
 * clip plays; scrolling by hand stops that until "Voltar ao trecho tocando".
 */
export function CaptionList(props: CaptionListProps): ReactNode {
    const { editor, words, playingIndex, openIndex, onOpen, onSeek, isLocked } = props;
    const draft = editor.draft;
    const cues = draft.cues;
    // Each check scans the whole transcript; the list re-renders every frame while the clip plays.
    const editedIndexes = findEditedCueIndexes(cues, words);
    const captionReset = useCaptionReset(editor, words);
    const undoableReset = captionReset.undoableReset;
    const listRef = useRef<HTMLDivElement>(null);
    const [isFollowing, setIsFollowing] = useState(true);

    useEffect(() => {
        const list = listRef.current;

        if (list === null || isFollowing === false || playingIndex < 0) {
            return;
        }

        const row = list.querySelector<HTMLElement>(`[data-cue-index="${playingIndex}"]`);
        row?.scrollIntoView({ block: "nearest" });
    }, [playingIndex, isFollowing]);

    return (
        <section
            aria-labelledby="studio-captions-title"
            className={cn("relative flex min-h-0 flex-col", props.className)}
        >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-2.5">
                <h2 id="studio-captions-title" className="text-sm font-semibold whitespace-nowrap">
                    <span className="sr-only">Legendas, </span>
                    {cues.length} {pluralize(cues.length, "bloco", "blocos")}
                </h2>
                <HintTooltip label="Desfaz suas mudanças em todas as legendas">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto pointer-coarse:h-11"
                        disabled={isLocked === true || captionReset.canResetAll === false}
                        onClick={captionReset.resetAll}
                    >
                        <RotateCcwIcon aria-hidden="true" />
                        Voltar ao original
                    </Button>
                </HintTooltip>
            </div>
            {/* Always mounted: screen readers only announce changes inside a live region they already know. */}
            <div role="status">
                {undoableReset !== null && (
                    <ResetUndoNotice
                        reset={undoableReset}
                        isLocked={isLocked}
                        onUndo={captionReset.undoReset}
                    />
                )}
            </div>
            {draft.captionStyle === "none" && <CaptionsOffNotice editor={editor} />}
            <div
                ref={listRef}
                onWheel={() => setIsFollowing(false)}
                onTouchMove={() => setIsFollowing(false)}
                className={cn(
                    "min-h-0 flex-1 overflow-y-auto p-2",
                    isLocked === true && "pointer-events-none opacity-50",
                )}
            >
                {cues.length === 0 && <NoSpeech />}
                {cues.map((cue, index) => {
                    const key = `${cue.startSeconds}-${index}`;

                    if (index === openIndex) {
                        return (
                            <div key={key} data-cue-index={index}>
                                <CueEditor
                                    draft={draft}
                                    index={index}
                                    cue={cue}
                                    words={words}
                                    onReplace={(replacement) =>
                                        editor.replaceCue(index, replacement)
                                    }
                                    onResetToOriginal={() => captionReset.resetCueAt(index)}
                                    onClose={() => onOpen(null)}
                                />
                            </div>
                        );
                    }

                    const text = cueText(cue);

                    return (
                        <button
                            key={key}
                            type="button"
                            data-cue-index={index}
                            onClick={() => {
                                onOpen(index);
                                onSeek(cue.startSeconds);
                            }}
                            className={cn(
                                "grid w-full grid-cols-[56px_minmax(0,1fr)] items-baseline gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition-[background-color,scale] hover:bg-accent/50 focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-inset motion-safe:active:scale-[0.99]",
                                index === playingIndex &&
                                    "bg-primary/10 shadow-[inset_3px_0_0_var(--primary)]",
                            )}
                        >
                            <time className="text-xs text-muted-foreground tabular-nums">
                                {formatClock(cue.startSeconds - draft.startSeconds)}
                            </time>
                            <span
                                className={cn(
                                    editedIndexes.has(index) === true &&
                                        "underline decoration-primary decoration-2 underline-offset-4",
                                )}
                            >
                                {text}
                            </span>
                        </button>
                    );
                })}
            </div>
            {isFollowing === false && (
                <button
                    type="button"
                    onClick={() => setIsFollowing(true)}
                    className="absolute bottom-3 left-1/2 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground px-3 text-sm font-semibold whitespace-nowrap text-background outline-none focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
                >
                    <LocateIcon className="size-4" aria-hidden="true" />
                    Voltar ao trecho tocando
                </button>
            )}
        </section>
    );
}
