import RestartIcon from "~icons/solar/restart-linear";
import SubtitlesIcon from "~icons/solar/subtitles-linear";
import TargetIcon from "~icons/solar/target-linear";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CaptionCue, CaptionWord } from "#/modules/clips/clip-studio.schema";
import { pluralize } from "#/shared/ui/pluralize";
import { CueEditor } from "#/modules/studio/ui/cue-editor";
import { cueText, transcriptWordsOf } from "#/modules/studio/ui/cue-editing";
import type { StudioEditor } from "#/modules/studio/ui/use-studio-editor";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";

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
            <StageCrewMascot status="transcribing" className="size-10" />
            <p className="font-bold">Nenhuma fala neste trecho</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Tinta não ouviu ninguém falando aqui. Mude o trecho para incluir fala, ou deixe o
                corte sem legenda.
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
    const editedIndexes = useMemo(() => findEditedCueIndexes(cues, words), [cues, words]);
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
            className={cn(
                "relative flex min-h-0 flex-col rounded-2xl border bg-popover",
                props.className,
            )}
        >
            <div className="flex items-center gap-2 border-b px-4 py-2.5">
                <h2
                    id="studio-captions-title"
                    className="flex items-center gap-2 text-base font-extrabold"
                >
                    <SubtitlesIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                    Legendas
                </h2>
                <span className="text-sm text-muted-foreground">
                    · {cues.length} {pluralize(cues.length, "bloco", "blocos")}
                </span>
                <span className="flex-1" />
                <HintTooltip label="Voltar tudo ao original">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Voltar todas as legendas ao texto original"
                        disabled={isLocked}
                        onClick={editor.resetAllCaptions}
                    >
                        <RestartIcon aria-hidden="true" />
                    </Button>
                </HintTooltip>
            </div>
            {draft.captionStyle === "none" && <CaptionsOffNotice editor={editor} />}
            <div
                ref={listRef}
                onWheel={() => setIsFollowing(false)}
                onTouchMove={() => setIsFollowing(false)}
                className={cn(
                    "min-h-0 flex-1 overflow-y-auto",
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
                                "grid w-full grid-cols-[56px_minmax(0,1fr)] items-baseline gap-3 border-b px-4 py-2.5 text-left text-sm outline-none transition-colors hover:bg-accent/50 focus-visible:ring-4 focus-visible:ring-ring/70 focus-visible:ring-inset",
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
                    className="absolute bottom-3 left-1/2 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground px-3 text-sm font-bold whitespace-nowrap text-background outline-none focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]"
                >
                    <TargetIcon className="size-4" aria-hidden="true" />
                    Voltar ao trecho tocando
                </button>
            )}
        </section>
    );
}
