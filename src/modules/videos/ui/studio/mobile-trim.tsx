import ScissorsIcon from "~icons/solar/scissors-linear";
import type { ReactNode } from "react";
import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS } from "#/modules/highlights/highlight-limits";
import { clamp } from "#/modules/videos/ui/studio/timeline-geometry";
import type { StudioEditor } from "#/modules/videos/ui/studio/use-studio-editor";
import { Button } from "#/shared/ui/button";
import { formatPreciseClock } from "#/modules/clips/clip-time";

const STEP_SECONDS = 0.5;

interface MobileTrimProps {
    editor: StudioEditor;
    videoDurationSeconds: number;
    currentSeconds: number;
    isLocked: boolean;
}

interface EdgeRowProps {
    label: string;
    seconds: number;
    isLocked: boolean;
    onMove: (deltaSeconds: number) => void;
}

function EdgeRow({ label, seconds, isLocked, onMove }: EdgeRowProps): ReactNode {
    return (
        <div className="grid gap-1.5">
            <span className="text-sm font-bold">{label}</span>
            <div className="grid grid-cols-[56px_1fr_56px] gap-2">
                <Button
                    variant="outline"
                    className="h-11"
                    aria-label={`${label}: meio segundo antes`}
                    disabled={isLocked}
                    onClick={() => onMove(-STEP_SECONDS)}
                >
                    −0,5
                </Button>
                <span className="grid h-11 place-items-center rounded-lg border bg-background text-base tabular-nums">
                    {formatPreciseClock(seconds).replace(".", ",")}
                </span>
                <Button
                    variant="outline"
                    className="h-11"
                    aria-label={`${label}: meio segundo depois`}
                    disabled={isLocked}
                    onClick={() => onMove(STEP_SECONDS)}
                >
                    +0,5
                </Button>
            </div>
        </div>
    );
}

/** Phones have no room to drag a timeline: the edges move in half-second steps instead. */
export function MobileTrim(props: MobileTrimProps): ReactNode {
    const { editor, videoDurationSeconds, currentSeconds, isLocked } = props;
    const draft = editor.draft;
    const lengthSeconds = draft.endSeconds - draft.startSeconds;

    const moveStart = (seconds: number): void => {
        const earliest = Math.max(0, draft.endSeconds - MAX_CLIP_SECONDS);
        editor.trim(
            clamp(seconds, earliest, draft.endSeconds - MIN_CLIP_SECONDS),
            draft.endSeconds,
        );
    };

    const moveEnd = (seconds: number): void => {
        const latest = Math.min(videoDurationSeconds, draft.startSeconds + MAX_CLIP_SECONDS);
        editor.trim(
            draft.startSeconds,
            clamp(seconds, draft.startSeconds + MIN_CLIP_SECONDS, latest),
        );
    };

    return (
        <section aria-label="Trecho do corte" className="grid gap-3 rounded-2xl border bg-card p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                <ScissorsIcon className="size-4" aria-hidden="true" />
                Trecho · {Math.round(lengthSeconds)} s (de {MIN_CLIP_SECONDS} a {MAX_CLIP_SECONDS}{" "}
                s)
            </p>
            <EdgeRow
                label="Início"
                seconds={draft.startSeconds}
                isLocked={isLocked}
                onMove={(delta) => moveStart(draft.startSeconds + delta)}
            />
            <EdgeRow
                label="Fim"
                seconds={draft.endSeconds}
                isLocked={isLocked}
                onMove={(delta) => moveEnd(draft.endSeconds + delta)}
            />
            <Button
                variant="outline"
                className="h-11"
                disabled={isLocked}
                onClick={() => moveStart(currentSeconds)}
            >
                Usar o ponto da prévia como início
            </Button>
        </section>
    );
}
