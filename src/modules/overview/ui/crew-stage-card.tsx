import type { ReactNode } from "react";
import { formatInteger } from "#/modules/overview/format-metric";
import type {
    OverviewFunnel,
    OverviewMetrics,
    OverviewStats,
} from "#/modules/overview/overview-views";
import { CompactMetric } from "#/modules/overview/ui/compact-metric";
import { findMetricDefinition } from "#/modules/overview/ui/metric-definitions";
import type { VideoStatus } from "#/modules/video-records/video-status";
import { CREW_NAMES } from "#/modules/videos/crew-lines";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { pluralize } from "#/shared/ui/pluralize";

export interface CrewStage {
    status: VideoStatus;
    role: string;
    metricKey: keyof OverviewMetrics;
    funnelKey: keyof OverviewFunnel;
}

export const CREW_STAGES: ReadonlyArray<CrewStage> = [
    { status: "downloading", role: "trouxe os vídeos", metricKey: "videosSent", funnelKey: "sent" },
    {
        status: "transcribing",
        role: "escreveu cada palavra",
        metricKey: "transcribedMinutes",
        funnelKey: "transcribed",
    },
    {
        status: "selecting",
        role: "escolheu os momentos",
        metricKey: "averageScore",
        funnelKey: "selected",
    },
    { status: "rendering", role: "montou os cortes", metricKey: "clipsReady", funnelKey: "ready" },
];

interface CrewStageCardProps {
    stage: CrewStage;
    stats: OverviewStats;
}

/** One crew member, what they did in the period and how many videos reached their stage. */
export function CrewStageCard({ stage, stats }: CrewStageCardProps): ReactNode {
    const name = CREW_NAMES[stage.status];
    const videoCount = stats.funnel[stage.funnelKey];

    return (
        <li className="grid content-start gap-4 rounded-2xl border bg-popover p-4 sm:p-5">
            <div className="flex items-center gap-3">
                <StageCrewMascot status={stage.status} className="size-11" />
                <p className="leading-tight">
                    <strong className="block font-extrabold">{name}</strong>
                    <span className="text-sm text-muted-foreground">{stage.role}</span>
                </p>
            </div>
            <CompactMetric
                definition={findMetricDefinition(stage.metricKey)}
                metric={stats.metrics[stage.metricKey]}
            />
            {/* Faísca's own number already counts the videos that arrived. */}
            {stage.funnelKey !== "sent" && (
                <p className="border-t pt-3 text-xs text-muted-foreground tabular-nums">
                    {formatInteger(videoCount)}{" "}
                    {pluralize(videoCount, "vídeo passou", "vídeos passaram")} por aqui
                </p>
            )}
        </li>
    );
}
