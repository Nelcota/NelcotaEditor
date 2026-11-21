import ScissorsIcon from "~icons/solar/scissors-linear";
import { useRef } from "react";
import type { ReactNode } from "react";
import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS } from "#/modules/clips/clip-limits";
import { CueTrack } from "#/modules/studio/ui/cue-track";
import { secondsAtPointer, tickSeconds, toPercent } from "#/modules/studio/ui/timeline-geometry";
import type { TimelineWindow } from "#/modules/studio/ui/timeline-geometry";
import { usePlaybackValue } from "#/modules/studio/ui/playback-clock";
import type { PlaybackClock } from "#/modules/studio/ui/playback-clock";
import { TrimRange } from "#/modules/studio/ui/trim-range";
import type { StudioEditor } from "#/modules/studio/ui/use-studio-editor";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";

// Ten frames recognise the scene without asking the server for many seeks.
const FILMSTRIP_FRAMES = 10;

interface StudioTimelineProps {
    editor: StudioEditor;
    window: TimelineWindow;
    sourceUrl: string | null;
    videoDurationSeconds: number;
    clock: PlaybackClock;
    playingIndex: number;
    openIndex: number | null;
    isLocked: boolean;
    onOpen: (index: number) => void;
    onSeek: (seconds: number) => void;
    onMarkStart: () => void;
    onMarkEnd: () => void;
}

function Filmstrip({ sourceUrl, window }: { sourceUrl: string | null; window: TimelineWindow }) {
    if (sourceUrl === null) {
        return <div className="absolute inset-0 bg-secondary" />;
    }

    const step = (window.toSeconds - window.fromSeconds) / FILMSTRIP_FRAMES;

    return (
        <div className="absolute inset-0 flex bg-black" aria-hidden="true">
            {Array.from({ length: FILMSTRIP_FRAMES }, (_, index) => {
                const seconds = Math.round(window.fromSeconds + step * (index + 0.5));

                return (
                    <video
                        key={seconds}
                        src={`${sourceUrl}#t=${seconds}`}
                        muted
                        playsInline
                        preload="metadata"
                        tabIndex={-1}
                        className="h-full min-w-0 flex-1 border-r border-black/60 object-cover"
                    />
                );
            })}
        </div>
    );
}

function Ruler({ window }: { window: TimelineWindow }): ReactNode {
    return (
        <div className="relative h-5 text-xs text-muted-foreground tabular-nums" aria-hidden="true">
            {tickSeconds(window).map((tick) => (
                <span
                    key={tick}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${toPercent(window, tick)}%` }}
                >
                    {formatClock(tick)}
                </span>
            ))}
        </div>
    );
}

// A tenth of a percent of the lane is under a pixel; finer steps would re-render for nothing.
const PLAYHEAD_STEPS_PER_PERCENT = 10;

/**
 * The line at the preview's time. It alone follows the clock every frame, and moves with a
 * transform (a full-width layer slid along the lane) instead of `left`, which re-ran layout.
 */
function Playhead({ clock, window }: { clock: PlaybackClock; window: TimelineWindow }) {
    const percent = usePlaybackValue(
        clock,
        (seconds) =>
            Math.round(toPercent(window, seconds) * PLAYHEAD_STEPS_PER_PERCENT) /
            PLAYHEAD_STEPS_PER_PERCENT,
    );

    return (
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-1 -bottom-1 z-20 overflow-x-clip"
        >
            <span
                className="absolute inset-y-0 left-0 w-full will-change-transform"
                style={{ transform: `translateX(${percent}%)` }}
            >
                <span className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-foreground" />
            </span>
        </span>
    );
}

/** The clip's place in the original: drag its edges, see its captions, click to jump there. */
export function StudioTimeline(props: StudioTimelineProps): ReactNode {
    const { editor, window, clock, isLocked } = props;
    const draft = editor.draft;
    const laneRef = useRef<HTMLDivElement>(null);
    const lengthSeconds = draft.endSeconds - draft.startSeconds;

    return (
        <section
            aria-labelledby="studio-timeline-title"
            className={cn(
                "grid gap-2 rounded-2xl border bg-popover px-4 pt-3 pb-4",
                isLocked === true && "opacity-60",
            )}
        >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2
                    id="studio-timeline-title"
                    className="flex items-center gap-2 text-lg leading-tight font-extrabold"
                >
                    <ScissorsIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                    Trecho do original
                </h2>
                <span className="text-sm text-muted-foreground tabular-nums">
                    {formatClock(draft.startSeconds)} a {formatClock(draft.endSeconds)} ·{" "}
                    {lengthSeconds.toFixed(1).replace(".", ",")} s (de {MIN_CLIP_SECONDS} a{" "}
                    {MAX_CLIP_SECONDS} s)
                </span>
                <span className="flex-1" />
                <Button variant="ghost" size="sm" disabled={isLocked} onClick={props.onMarkStart}>
                    Marcar início aqui <kbd className="rounded border px-1 text-xs">[</kbd>
                </Button>
                <Button variant="ghost" size="sm" disabled={isLocked} onClick={props.onMarkEnd}>
                    Marcar fim aqui <kbd className="rounded border px-1 text-xs">]</kbd>
                </Button>
            </div>
            <Ruler window={window} />
            <div
                ref={laneRef}
                onPointerDown={(event) => {
                    const lane = laneRef.current;

                    if (lane === null) {
                        return;
                    }

                    props.onSeek(secondsAtPointer(window, lane, event.clientX));
                }}
                className="relative h-14 cursor-pointer touch-none rounded-lg"
            >
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <Filmstrip sourceUrl={props.sourceUrl} window={window} />
                </div>
                <TrimRange
                    draft={draft}
                    window={window}
                    laneRef={laneRef}
                    videoDurationSeconds={props.videoDurationSeconds}
                    isLocked={isLocked}
                    onTrim={editor.trim}
                />
                <Playhead clock={clock} window={window} />
            </div>
            <CueTrack
                draft={draft}
                window={window}
                playingIndex={props.playingIndex}
                openIndex={props.openIndex}
                isLocked={isLocked}
                onOpen={props.onOpen}
                onRetime={(index, cue) => editor.replaceCue(index, [cue])}
            />
        </section>
    );
}
