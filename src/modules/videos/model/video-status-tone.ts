import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { isVideoWorking } from "#/modules/video-records/model/video-status";
import type { StatusTone } from "#/shared/ui/status-badge";

const FINISHED_TONES: Partial<Record<VideoStatus, StatusTone>> = {
    queued: "waiting",
    done: "success",
    failed: "danger",
    cancelled: "stopped",
};

/** Every stage between the queue and the end reads as work in progress. */
export function toVideoStatusTone(status: VideoStatus): StatusTone {
    if (isVideoWorking(status) === true) {
        return "working";
    }

    return FINISHED_TONES[status] ?? "working";
}
