import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS } from "#/modules/clips/model/clip-limits";
import type { PlaybackClock } from "#/modules/studio/ui/hooks/playback-clock";
import { clamp } from "#/modules/studio/client/timeline-geometry";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";

export interface TrimMarks {
    markStart: () => void;
    markEnd: () => void;
}

interface TrimMarksInput {
    editor: StudioEditor;
    clock: PlaybackClock;
    videoDurationSeconds: number;
}

/** "Start here" and "end here" at the preview's time, keeping the clip 15 to 90 s long. */
export function useTrimMarks({ editor, clock, videoDurationSeconds }: TrimMarksInput): TrimMarks {
    const draft = editor.draft;

    const markStart = (): void => {
        const earliest = Math.max(0, draft.endSeconds - MAX_CLIP_SECONDS);
        const start = clamp(clock.read(), earliest, draft.endSeconds - MIN_CLIP_SECONDS);
        editor.trim(start, draft.endSeconds);
    };

    const markEnd = (): void => {
        const latest = Math.min(videoDurationSeconds, draft.startSeconds + MAX_CLIP_SECONDS);
        const end = clamp(clock.read(), draft.startSeconds + MIN_CLIP_SECONDS, latest);
        editor.trim(draft.startSeconds, end);
    };

    return { markStart, markEnd };
}
