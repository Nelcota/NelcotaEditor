import RotateCwIcon from "~icons/lucide/rotate-cw";
import ScissorsIcon from "~icons/lucide/scissors";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { formatPreciseClock, parseClockInput } from "#/modules/clips/clip-time";
import { TIME_TOLERANCE_SECONDS } from "#/modules/clips/clip-studio.schema";
import type { CaptionCue, CaptionWord, StudioDraft } from "#/modules/clips/clip-studio.schema";
import {
    isShorterThanMinimumCue,
    cueLimits,
    cueText,
    editCueText,
    resetCue,
    retimeCue,
    splitCue,
    transcriptWordsOf,
} from "#/modules/studio/ui/cue-editing";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";

const UNREADABLE_TIME_MESSAGE = "Use segundos (8,5) ou minutos e segundos (1:08,5).";
const OUT_OF_RANGE_MESSAGE = "Fora do espaço livre entre os blocos vizinhos.";
const CUE_TIME_ERROR_ID = "cue-time-error";
const TOO_SHORT_MESSAGE = "Uma legenda precisa durar pelo menos 0,2 s.";
const WHITESPACE = /\s+/;
const HUNDREDTHS_PER_SECOND = 100;

/** Drops float noise from adding clip and cue times (0.14 + 17.6 is 17.740000000000002). */
function roundToHundredths(seconds: number): number {
    return Math.round(seconds * HUNDREDTHS_PER_SECOND) / HUNDREDTHS_PER_SECOND;
}

function describeError(error: string | null): string | undefined {
    if (error === null) {
        return undefined;
    }

    return CUE_TIME_ERROR_ID;
}

interface CueEditorProps {
    draft: StudioDraft;
    index: number;
    cue: CaptionCue;
    words: Array<CaptionWord>;
    onReplace: (replacement: Array<CaptionCue>) => void;
    onClose: () => void;
}

/** Clip-relative time, as people read it on the preview's clock. */
function toClipClock(draft: StudioDraft, seconds: number): string {
    return formatPreciseClock(seconds - draft.startSeconds).replace(".", ",");
}

function countWordsBefore(text: string, cursor: number): number {
    return text
        .slice(0, cursor)
        .trim()
        .split(WHITESPACE)
        .filter((word) => word.length > 0).length;
}

function TimeField({
    label,
    value,
    error,
    onCommit,
}: {
    label: string;
    value: string;
    error: string | null;
    onCommit: (text: string) => void;
}): ReactNode {
    return (
        <label className="grid gap-1">
            <span className="sr-only">{label}</span>
            <input
                key={value}
                defaultValue={value}
                inputMode="decimal"
                aria-label={label}
                aria-invalid={error !== null}
                onBlur={(event) => onCommit(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        onCommit(event.currentTarget.value);
                    }
                }}
                aria-describedby={describeError(error)}
                enterKeyHint="done"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base tabular-nums outline-none transition-colors hover:border-ring/60 sm:text-sm focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring aria-invalid:border-destructive"
            />
        </label>
    );
}

/** One caption opened for editing: its words, when it shows, split it or bring Tinta's back. */
export function CueEditor({ draft, index, cue, words, onReplace, onClose }: CueEditorProps) {
    const textRef = useRef<HTMLInputElement>(null);
    const [text, setText] = useState(cueText(cue));
    const [timeError, setTimeError] = useState<string | null>(null);
    const originalText = cueText({ ...cue, words: transcriptWordsOf(cue, words) });
    const limits = cueLimits(draft, index);

    const commitText = (): CaptionCue | null => {
        const edited = editCueText(cue, text);

        if (edited === null) {
            onReplace([]);
            onClose();
            return null;
        }

        if (cueText(edited) !== cueText(cue)) {
            onReplace([edited]);
        }

        return edited;
    };

    const commitTime = (edge: "start" | "end", typed: string): void => {
        const relativeSeconds = parseClockInput(typed);

        if (relativeSeconds === null) {
            setTimeError(UNREADABLE_TIME_MESSAGE);
            return;
        }

        const seconds = roundToHundredths(draft.startSeconds + relativeSeconds);
        let startSeconds = cue.startSeconds;
        let endSeconds = cue.endSeconds;

        if (edge === "start") {
            startSeconds = seconds;
        }

        if (edge === "end") {
            endSeconds = seconds;
        }

        // Times show in tenths but are stored in hundredths, so retyping a neighbour's shown
        // edge can land a few hundredths past it; accept that and snap it onto the limit.
        if (
            startSeconds < limits.min - TIME_TOLERANCE_SECONDS ||
            endSeconds > limits.max + TIME_TOLERANCE_SECONDS
        ) {
            setTimeError(OUT_OF_RANGE_MESSAGE);
            return;
        }

        startSeconds = Math.max(startSeconds, limits.min);
        endSeconds = Math.min(endSeconds, limits.max);

        if (startSeconds >= endSeconds) {
            setTimeError(OUT_OF_RANGE_MESSAGE);
            return;
        }

        if (isShorterThanMinimumCue(startSeconds, endSeconds) === true) {
            setTimeError(TOO_SHORT_MESSAGE);
            return;
        }

        setTimeError(null);

        if (startSeconds === cue.startSeconds && endSeconds === cue.endSeconds) {
            return;
        }

        onReplace([retimeCue(cue, startSeconds, endSeconds)]);
    };

    const split = (): void => {
        const input = textRef.current;
        const edited = editCueText(cue, text);

        if (input === null || edited === null) {
            return;
        }

        const parts = splitCue(edited, countWordsBefore(text, input.selectionStart ?? 0));

        if (parts === null) {
            return;
        }

        onReplace(parts);
        onClose();
    };

    return (
        <div className="grid gap-2.5 border-b bg-popover px-4 py-3 shadow-[inset_3px_0_0_var(--primary)]">
            <input
                ref={textRef}
                autoFocus
                value={text}
                aria-label="Texto do bloco"
                onChange={(event) => setText(event.target.value)}
                onBlur={() => commitText()}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        commitText();
                        onClose();
                    }

                    if (event.key === "Escape") {
                        setText(cueText(cue));
                        onClose();
                    }
                }}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring"
            />
            <div className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2">
                <TimeField
                    label="Início do bloco"
                    value={toClipClock(draft, cue.startSeconds)}
                    error={timeError}
                    onCommit={(typed) => commitTime("start", typed)}
                />
                <TimeField
                    label="Fim do bloco"
                    value={toClipClock(draft, cue.endSeconds)}
                    error={timeError}
                    onCommit={(typed) => commitTime("end", typed)}
                />
                <HintTooltip label="Dividir no cursor">
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Dividir o bloco onde está o cursor"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={split}
                    >
                        <ScissorsIcon aria-hidden="true" />
                    </Button>
                </HintTooltip>
                <HintTooltip label="Voltar ao original">
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Voltar este bloco ao texto original"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                            const original = resetCue(cue, words);
                            setText(cueText(original));
                            onReplace([original]);
                        }}
                    >
                        <RotateCwIcon aria-hidden="true" />
                    </Button>
                </HintTooltip>
            </div>
            {timeError !== null && (
                <p id={CUE_TIME_ERROR_ID} role="alert" className="text-xs text-destructive">
                    {timeError}
                </p>
            )}
            {originalText.length > 0 && originalText !== cueText(cue) && (
                <p className="text-xs text-muted-foreground">Antes: “{originalText}”</p>
            )}
        </div>
    );
}
