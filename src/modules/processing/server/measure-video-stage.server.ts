import { logger } from "#/shared/server/logger.server";

type VideoStageName = "source" | "transcript" | "highlights" | "clips";

interface VideoStage {
    videoId: string;
    name: VideoStageName;
}

/**
 * Logs how long each pipeline step took, so a slow run shows which step (download, Whisper,
 * DeepSeek, ffmpeg) held it. Only finished steps are logged; failures are logged by the pipeline.
 */
export async function measureVideoStage<Result>(
    stage: VideoStage,
    runStage: () => Promise<Result>,
): Promise<Result> {
    const startedAt = performance.now();
    const result = await runStage();
    const durationMs = Math.round(performance.now() - startedAt);

    logger.info({ videoId: stage.videoId, stage: stage.name, durationMs }, "Video stage finished");
    return result;
}
