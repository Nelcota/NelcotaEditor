import { isAppSwitchEnabled } from "#/modules/app-switches/server/app-switches.server";
import { logger } from "#/shared/server/logger.server";

interface VideoWorkControls {
    /** Starts taking videos from the queue. */
    startWork: () => Promise<void>;
    /** Stops taking new videos and waits for the ones running to finish. */
    stopWork: () => Promise<void>;
}

/**
 * Follows the admin's "video-processing" switch: paused, the worker takes no new videos (they wait
 * queued) and the ones already running finish. Call the returned function at start and then on an
 * interval, one call at a time.
 */
export function createVideoWorkSync(controls: VideoWorkControls): () => Promise<void> {
    let isWorking = false;

    return async (): Promise<void> => {
        const shouldWork = await isAppSwitchEnabled("video-processing");

        if (shouldWork === isWorking) {
            return;
        }

        if (shouldWork === true) {
            await controls.startWork();
            isWorking = true;
            logger.info({}, "Video processing running");
            return;
        }

        logger.warn(
            {},
            "Video processing paused by an admin; finishing the videos already running",
        );
        await controls.stopWork();
        isWorking = false;
    };
}
