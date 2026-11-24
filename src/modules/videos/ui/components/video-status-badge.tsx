import type { ReactNode } from "react";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { VIDEO_STATUS_LABELS } from "#/modules/videos/model/video-status-labels";
import { toVideoStatusTone } from "#/modules/videos/model/video-status-tone";
import { StatusBadge } from "#/shared/ui/status-badge";

export function VideoStatusBadge({ status }: { status: VideoStatus }): ReactNode {
    return <StatusBadge tone={toVideoStatusTone(status)} label={VIDEO_STATUS_LABELS[status]} />;
}
