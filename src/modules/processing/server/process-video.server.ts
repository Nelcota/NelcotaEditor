import { ensureHighlights } from "#/modules/highlights/server/select-highlights.server";
import { watchForCancellation } from "#/modules/processing/server/cancellation-watch.server";
import { renderPendingClips } from "#/modules/processing/server/render-pending-clips.server";
import { ensureTranscript } from "#/modules/transcription/server/transcribe-video.server";
import { prepareVideoSource } from "#/modules/videos/server/prepare-video-source.server";
import {
    findVideoById,
    markVideoCancelled,
    markVideoDone,
    markVideoFailed,
} from "#/modules/videos/server/video-progress.server";
import { isVideoFinished } from "#/modules/videos/video-status";
import { toUserMessage } from "#/shared/server/user-facing-error";

/**
 * The whole pipeline: source → transcript → highlights → clips.
 * Every step skips work that is already saved, so running it again resumes where it stopped.
 */
async function runPipeline(videoId: string, signal: AbortSignal): Promise<void> {
    const video = await findVideoById(videoId);

    // Finished or cancelled while waiting in the queue: nothing to do.
    if (video === null || isVideoFinished(video.status) === true) {
        return;
    }

    const source = await prepareVideoSource(video, signal);
    const words = await ensureTranscript({
        videoId,
        sourcePath: source.sourcePath,
        language: video.transcriptionLanguage,
        signal,
    });
    const clips = await ensureHighlights({
        video,
        words,
        durationSeconds: source.durationSeconds,
        signal,
    });

    await renderPendingClips({ videoId, sourcePath: source.sourcePath, clips, words, signal });
    signal.throwIfAborted();
    await markVideoDone(videoId);
}

export async function processVideo(videoId: string): Promise<void> {
    const cancellation = watchForCancellation(videoId);

    try {
        await runPipeline(videoId, cancellation.signal);
    } catch (error) {
        if (cancellation.signal.aborted === true) {
            console.info(`Video ${videoId} was cancelled.`);
            await markVideoCancelled(videoId);
            return;
        }

        // The failure is recorded on the video so the user sees it and can retry.
        console.error(`Failed to process video ${videoId}`, error);
        await markVideoFailed(videoId, toUserMessage(error));
    } finally {
        cancellation.stop();
    }
}
