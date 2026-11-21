import CheckCircleIcon from "~icons/solar/check-circle-linear";
import DangerCircleIcon from "~icons/solar/danger-circle-linear";
import ForbiddenCircleIcon from "~icons/solar/forbidden-circle-linear";
import ClockCircleIcon from "~icons/solar/clock-circle-linear";
import type { IconComponent } from "#/shared/ui/icon-component";
import type { VideoStatus } from "#/modules/video-records/video-status";
import { isVideoWorking } from "#/modules/video-records/video-status";
import { VIDEO_STATUS_LABELS } from "#/modules/videos/ui/video-status-labels";
import { cn } from "#/shared/ui/cn";
import { Spinner } from "#/shared/ui/spinner";

interface BadgeStyle {
    icon: IconComponent;
    className: string;
}

const WORKING_STYLE: BadgeStyle = {
    icon: Spinner,
    className: "bg-primary/15 text-primary",
};

const BADGE_STYLES: Partial<Record<VideoStatus, BadgeStyle>> = {
    queued: { icon: ClockCircleIcon, className: "bg-muted text-muted-foreground" },
    done: { icon: CheckCircleIcon, className: "bg-success/15 text-success" },
    failed: { icon: DangerCircleIcon, className: "bg-destructive/15 text-destructive" },
    cancelled: { icon: ForbiddenCircleIcon, className: "bg-muted text-muted-foreground" },
};

function resolveStyle(status: VideoStatus): BadgeStyle {
    if (isVideoWorking(status) === true) {
        return WORKING_STYLE;
    }

    return BADGE_STYLES[status] ?? WORKING_STYLE;
}

export function VideoStatusBadge({ status }: { status: VideoStatus }) {
    const style = resolveStyle(status);
    const Icon = style.icon;

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                style.className,
            )}
        >
            <Icon className="size-4" aria-hidden="true" />
            {VIDEO_STATUS_LABELS[status]}
        </span>
    );
}
