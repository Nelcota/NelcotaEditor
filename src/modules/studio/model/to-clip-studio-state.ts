import { groupWordsIntoCues, wordsInsideRange } from "#/modules/clips/model/caption-cues";
import type { CaptionCue, CaptionWord } from "#/modules/clips/model/clip-studio";
import type { ClipStudioState } from "#/modules/studio/model/clip-studio-view";
import type { ClipStudioSnapshot } from "#/modules/studio/server/clip-studio-snapshot-functions";

interface TimeRange {
    startSeconds: number;
    endSeconds: number;
}

function transcriptCues(words: Array<CaptionWord>, range: TimeRange): Array<CaptionCue> {
    return groupWordsIntoCues(wordsInsideRange(words, range));
}

/**
 * The clip's Studio state with its applied captions: the edited ones, or the transcript's words
 * inside the clip, grouped the way the renderer groups them.
 */
export function toClipStudioState(
    snapshot: ClipStudioSnapshot,
    words: Array<CaptionWord>,
): ClipStudioState {
    const settings = snapshot.appliedSettings;

    return {
        clip: snapshot.clip,
        applied: { ...settings, cues: snapshot.appliedCues ?? transcriptCues(words, settings) },
        draft: snapshot.draft,
        draftVersion: snapshot.draftVersion,
        videoDurationSeconds: snapshot.videoDurationSeconds,
    };
}
