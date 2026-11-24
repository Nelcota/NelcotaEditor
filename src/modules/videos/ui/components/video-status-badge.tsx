import CircleCheckIcon from "~icons/lucide/circle-check";
import CircleAlertIcon from "~icons/lucide/circle-alert";
import BanIcon from "~icons/lucide/ban";
import ClockIcon from "~icons/lucide/clock";
import type { IconComponent } from "#/shared/ui/icon-component";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { isVideoWorking } from "#/modules/video-records/model/video-status";
import { VIDEO_STATUS_LABELS } from "#/modules/videos/model/video-status-labels";
import { cn } from "#/shared/ui/cn";
import { Spinner } from "#/shared/ui/spinner";

interface BadgeStyle {
    icon: IconComponent;
    className: string;
}

const WORKING_STYLE: BadgeStyle = {
    icon: Spinner,
    className: "bg-primary/15 text-primary-ink",
};

const BADGE_STYLES: Partial<Record<VideoStatus, BadgeStyle>> = {
    queued: { icon: ClockIcon, className: "bg-muted text-muted-foreground" },
    // Green and red text on their own 15% tint measured under 4.5:1 at 13px, so the label is ink
    // and the tint and the coloured icon carry the hue.
    done: {
        icon: CircleCheckIcon,
        className: "bg-success/15 text-foreground [&>svg]:text-success",
    },
    failed: {
        icon: CircleAlertIcon,
        className: "bg-destructive/15 text-foreground [&>svg]:text-destructive",
    },
    cancelled: { icon: BanIcon, className: "bg-muted text-muted-foreground" },
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
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                style.className,
            )}
        >
            <Icon className="size-4" aria-hidden="true" />
            {VIDEO_STATUS_LABELS[status]}
        </span>
    );
}
