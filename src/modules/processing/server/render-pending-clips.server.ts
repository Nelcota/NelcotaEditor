import { renderClip, setClipStatus } from "#/modules/clips/server/render-clip.server";
import type { Clip } from "#/modules/clips/clips.schema";
import { toOverallPercent } from "#/modules/processing/model/processing-stages";
import { runLanesToTheEnd } from "#/modules/processing/server/run-lanes-to-the-end.server";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { updateVideoStage } from "#/modules/video-records/server/video-progress.server";
import { runWithProgress } from "#/shared/server/run-with-progress.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

/** Clips rendered at once; ffmpeg already uses several cores, so more lanes stop paying off. */
const RENDER_CONCURRENCY = 2;
const PERCENT = 100;

interface RenderPendingClipsInput {
    videoId: string;
    sourcePath: string;
    clips: Array<Clip>;
    words: Array<TranscriptWord>;
    signal: AbortSignal;
}

/** Returns whether the clip ended up rendered. */
async function renderOneClip(clip: Clip, input: RenderPendingClipsInput): Promise<boolean> {
    const { videoId, sourcePath, words, signal } = input;

    if (clip.status === "done") {
        return true;
    }

    try {
        await setClipStatus(clip.id, "rendering");
        await renderClip({ clip, sourcePath, words, signal });
        return true;
    } catch (error) {
        if (signal.aborted === true) {
            // Cancelled: the clip goes back to the queue for when the user resumes.
            await setClipStatus(clip.id, "pending");
            throw error;
        }

        // One broken clip should not throw away the others; it is marked as failed instead.
        console.error(`Failed to render clip ${clip.id} of video ${videoId}`, error);
        await setClipStatus(clip.id, "failed");
        return false;
    }
}

async function renderAll(
    input: RenderPendingClipsInput,
    onProgress: (percent: number) => void,
): Promise<number> {
    const clips = input.clips;
    let finishedCount = 0;
    const outcomes = await runLanesToTheEnd(clips, RENDER_CONCURRENCY, async (clip) => {
        const isRendered = await renderOneClip(clip, input);
        finishedCount += 1;
        onProgress((finishedCount / clips.length) * PERCENT);
        return isRendered;
    });

    return outcomes.filter((isRendered) => isRendered === true).length;
}

/** Renders every clip that is not done yet, so a retry only redoes what failed. */
export async function renderPendingClips(input: RenderPendingClipsInput): Promise<void> {
    const { videoId, clips } = input;

    // Also keeps renderAll from dividing by zero when it reports progress.
    if (clips.length === 0) {
        throw new UserFacingError("Nenhum corte foi gerado.");
    }

    const saveProgress = (stagePercent: number): Promise<void> =>
        updateVideoStage(videoId, "rendering", toOverallPercent("rendering", stagePercent));

    await saveProgress(0);
    const renderedCount = await runWithProgress(
        (onProgress) => renderAll(input, onProgress),
        saveProgress,
    );

    if (renderedCount === 0) {
        throw new UserFacingError("Não foi possível renderizar os cortes. Tente novamente.");
    }
}
