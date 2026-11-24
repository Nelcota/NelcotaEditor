import RotateCcwIcon from "~icons/lucide/rotate-ccw";
import ScissorsLineDashedIcon from "~icons/lucide/scissors-line-dashed";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { formatPreciseClock, parseClockInput } from "#/modules/clips/model/clip-time";
import { TIME_TOLERANCE_SECONDS } from "#/modules/clips/model/clip-studio";
import type { CaptionCue, CaptionWord, StudioDraft } from "#/modules/clips/model/clip-studio";
import {
    isShorterThanMinimumCue,
    cueLimits,
    cueText,
    editCueText,
    retimeCue,
    splitCue,
    transcriptWordsOf,
} from "#/modules/studio/model/cue-editing";
import { isCueChangedFromOriginal } from "#/modules/studio/model/caption-reset";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { Input } from "#/shared/ui/input";

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
    /** Brings the cue back to the transcript; the list offers the undo. */
    onResetToOriginal: () => void;
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
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <Input
                key={value}
                defaultValue={value}
                inputMode="decimal"
                aria-invalid={error !== null}
                onBlur={(event) => onCommit(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        onCommit(event.currentTarget.value);
                    }
                }}
                aria-describedby={describeError(error)}
                enterKeyHint="done"
                className="tabular-nums"
            />
        </label>
    );
}

/** One caption opened for editing: its words, when it shows, split it or bring Tinta's back. */
export function CueEditor(props: CueEditorProps): ReactNode {
    const { draft, index, cue, words, onReplace, onResetToOriginal, onClose } = props;
    const textRef = useRef<HTMLInputElement>(null);

    // The editor opens because the person picked this caption, so its text is ready to type.
    useEffect(() => {
        const input = textRef.current;

        if (input === null) {
            return;
        }

        input.focus();
    }, []);
    const currentText = cueText(cue);
    const [text, setText] = useState(currentText);
    const [shownCueText, setShownCueText] = useState(currentText);
    const [timeError, setTimeError] = useState<string | null>(null);

    // An undo or a reset changes the cue from outside; the field follows it instead of keeping old text.
    if (currentText !== shownCueText) {
        setShownCueText(currentText);
        setText(currentText);
    }

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
        <div className="grid gap-2.5 rounded-lg bg-popover px-3 py-3 shadow-[inset_3px_0_0_var(--primary)]">
            <Input
                ref={textRef}
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
                className="h-11"
            />
            <div className="grid grid-cols-2 gap-2">
                <TimeField
                    label="Início"
                    value={toClipClock(draft, cue.startSeconds)}
                    error={timeError}
                    onCommit={(typed) => commitTime("start", typed)}
                />
                <TimeField
                    label="Fim"
                    value={toClipClock(draft, cue.endSeconds)}
                    error={timeError}
                    onCommit={(typed) => commitTime("end", typed)}
                />
            </div>
            {timeError !== null && (
                <p id={CUE_TIME_ERROR_ID} role="alert" className="text-xs text-destructive">
                    {timeError}
                </p>
            )}
            <div className="flex flex-wrap gap-2">
                <HintTooltip label="Divide o bloco em dois, onde está o cursor do texto">
                    <Button
                        variant="outline"
                        aria-label="Dividir o bloco onde está o cursor"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={split}
                    >
                        <ScissorsLineDashedIcon aria-hidden="true" />
                        Dividir
                    </Button>
                </HintTooltip>
                <Button
                    variant="outline"
                    disabled={isCueChangedFromOriginal(cue, words) === false}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={onResetToOriginal}
                >
                    <RotateCcwIcon aria-hidden="true" />
                    Voltar ao original
                </Button>
            </div>
            {originalText.length > 0 && originalText !== currentText && (
                <p className="text-xs text-muted-foreground">Antes: “{originalText}”</p>
            )}
        </div>
    );
}
