import BanIcon from "~icons/lucide/ban";
import CircleAlertIcon from "~icons/lucide/circle-alert";
import CircleCheckIcon from "~icons/lucide/circle-check";
import ClockIcon from "~icons/lucide/clock";
import LoaderCircleIcon from "~icons/lucide/loader-circle";
import { isVideoWorking } from "#/modules/video-records/model/video-status";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { VIDEO_STATUS_LABELS } from "#/modules/videos/model/video-status-labels";
import type { IconComponent } from "#/shared/ui/icon-component";

export type StatusTone = "success" | "working" | "waiting" | "danger";

export interface TableStatus {
    /** The short word in the status pill. */
    label: string;
    /** The longer line over the progress bar. */
    stageLabel: string;
    tone: StatusTone;
    icon: IconComponent;
}

const WORKING_STATUS: Omit<TableStatus, "stageLabel"> = {
    label: "Processando",
    tone: "working",
    icon: LoaderCircleIcon,
};

const FINISHED_STATUSES: Partial<Record<VideoStatus, TableStatus>> = {
    queued: { label: "Na fila", stageLabel: "Aguardando a vez", tone: "waiting", icon: ClockIcon },
    done: { label: "Pronto", stageLabel: "Concluído", tone: "success", icon: CircleCheckIcon },
    failed: {
        label: "Falhou",
        stageLabel: "Parou com erro",
        tone: "danger",
        icon: CircleAlertIcon,
    },
    cancelled: { label: "Cancelado", stageLabel: "Cancelado", tone: "waiting", icon: BanIcon },
};

/** Pill tints: the label stays ink, the tint and the icon carry the hue (contrast at 13px). */
export const STATUS_PILL_CLASSES: Record<StatusTone, string> = {
    success: "bg-success/15 [&>svg]:text-success",
    working: "bg-primary/15 text-primary-ink",
    waiting: "bg-secondary text-muted-foreground",
    danger: "bg-destructive/15 [&>svg]:text-destructive",
};

export const STATUS_BAR_CLASSES: Record<StatusTone, string> = {
    success: "bg-success",
    working: "bg-primary",
    waiting: "bg-muted-foreground/50",
    danger: "bg-destructive",
};

/** How a video's status reads in the table: a short pill and the stage over the bar. */
export function toTableStatus(status: VideoStatus): TableStatus {
    if (isVideoWorking(status) === true) {
        return { ...WORKING_STATUS, stageLabel: VIDEO_STATUS_LABELS[status] };
    }

    const finished = FINISHED_STATUSES[status];

    if (finished === undefined) {
        return { ...WORKING_STATUS, stageLabel: VIDEO_STATUS_LABELS[status] };
    }

    return finished;
}
