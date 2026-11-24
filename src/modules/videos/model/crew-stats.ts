import type { VideoStatus } from "#/modules/video-records/model/video-status";
import type { UsageSummary } from "#/modules/videos/model/video-views";

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

const numberFormatter = new Intl.NumberFormat("pt-BR");

export interface CrewStat {
    stage: VideoStatus;
    value: string;
    label: string;
    detail: string;
}

/**
 * 5400 → "1 h 30 min", 300 → "5 min", 0 → "0 min". Rounds to whole minutes first, so 3599 is
 * "1 h 0 min" and never "60 min".
 */
export function formatProcessedTime(totalSeconds: number): string {
    if (Number.isFinite(totalSeconds) === false || totalSeconds <= 0) {
        return "0 min";
    }

    const totalMinutes = Math.round(totalSeconds / SECONDS_PER_MINUTE);
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const minutes = totalMinutes % MINUTES_PER_HOUR;

    if (hours === 0) {
        return `${minutes} min`;
    }

    return `${hours} h ${minutes} min`;
}

/** Each number is credited to the crew member who did that part of the work. */
export function toCrewStats(usage: UsageSummary): Array<CrewStat> {
    return [
        {
            stage: "downloading",
            value: numberFormatter.format(usage.videoCount),
            label: "vídeos recebidos",
            detail: `${numberFormatter.format(usage.readyVideoCount)} prontos`,
        },
        {
            stage: "transcribing",
            value: formatProcessedTime(usage.processedSeconds),
            label: "de vídeo transcrito",
            detail: "somando os vídeos prontos",
        },
        {
            stage: "selecting",
            value: numberFormatter.format(usage.selectedClipCount),
            label: "momentos escolhidos",
            detail: "os melhores trechos",
        },
        {
            stage: "rendering",
            value: numberFormatter.format(usage.readyClipCount),
            label: "cortes com legenda",
            detail: `${numberFormatter.format(usage.clipsThisMonth)} este mês`,
        },
    ];
}
