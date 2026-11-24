import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/clip-view";
import { cn } from "#/shared/ui/cn";
import { toBarPercent } from "#/shared/ui/media-player/seek-bar";

const PERCENT = 100;
// Short clips on a long video would be invisible slivers; this keeps each one visible.
const MIN_MARK_PERCENT = 0.8;

interface MarkBox {
    left: string;
    width: string;
}

/** A widened short clip near the end is pulled left so it never spills past the bar. */
function toMarkBox(clip: ClipView, durationSeconds: number): MarkBox {
    const lengthPercent = toBarPercent(clip.endSeconds - clip.startSeconds, durationSeconds);
    const widthPercent = Math.max(lengthPercent, MIN_MARK_PERCENT);
    const leftPercent = Math.min(
        toBarPercent(clip.startSeconds, durationSeconds),
        PERCENT - widthPercent,
    );

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
}

interface ClipMarksProps {
    clips: Array<ClipView>;
    selectedClipId: string;
    durationSeconds: number;
}

/** Where every clip comes from, in blue on the original's progress bar; the one picked is outlined. */
export function ClipMarks({ clips, selectedClipId, durationSeconds }: ClipMarksProps): ReactNode {
    if (Number.isFinite(durationSeconds) === false || durationSeconds <= 0) {
        return null;
    }

    return clips.map((clip) => (
        <span
            key={clip.id}
            aria-hidden="true"
            className={cn(
                "pointer-events-none absolute -inset-y-0.5 rounded-[3px]",
                clip.status === "failed" && "bg-destructive/70",
                clip.status !== "failed" && "bg-primary/60",
                clip.id === selectedClipId && "z-[1] bg-primary ring-2 ring-white",
            )}
            style={toMarkBox(clip, durationSeconds)}
        />
    ));
}
