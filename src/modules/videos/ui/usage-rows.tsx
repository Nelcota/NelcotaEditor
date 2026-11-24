import RotateCwIcon from "~icons/lucide/rotate-cw";
import TriangleAlertIcon from "~icons/lucide/triangle-alert";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { CREW_NAMES, HOST_NAME } from "#/modules/videos/crew-lines";
import { toCrewStats } from "#/modules/videos/ui/crew-stats";
import type { CrewStat } from "#/modules/videos/ui/crew-stats";
import { usageQueryOptions } from "#/modules/videos/ui/library-queries";
import { NewVideoLink } from "#/modules/videos/ui/new-video-link";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import type { UsageSummary } from "#/modules/videos/video-views";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { formatBytes } from "#/shared/ui/format";
import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { SettingsRow } from "#/shared/ui/settings-row";
import { Skeleton } from "#/shared/ui/skeleton";

const PERCENT = 100;
const WARNING_PERCENT = 80;
const ROW_MASCOT_CLASS = "size-7";

/** The tiles' labels lean on the number before them ("28 min de vídeo transcrito"); a row needs a name. */
const ROW_LABELS: Partial<Record<CrewStat["stage"], string>> = {
    transcribing: "Tempo de vídeo transcrito",
};

/** Not clamped: going past the quota is exactly what the warning reports. */
function toPercentOfQuota(totalBytes: number, quotaBytes: number): number {
    if (Number.isFinite(quotaBytes) === false || quotaBytes <= 0) {
        return 0;
    }

    if (Number.isFinite(totalBytes) === false || totalBytes <= 0) {
        return 0;
    }

    return Math.round((totalBytes / quotaBytes) * PERCENT);
}

function capitalize(text: string): string {
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

/** Nothing is blocked at the quota; the line only says what to do before the disk fills. */
function describeStorage(usedPercent: number, usedLabel: string): ReactNode {
    if (usedPercent < WARNING_PERCENT) {
        return usedLabel;
    }

    return (
        <span role="status" className="inline-flex items-center gap-1.5 text-destructive">
            <TriangleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
            {`${usedLabel}. Exclua vídeos antigos ou apague originais para liberar espaço.`}
        </span>
    );
}

function StorageRow({ usage }: { usage: UsageSummary }): ReactNode {
    const totalBytes = usage.storage.totalBytes;
    const quotaBytes = usage.storageQuotaBytes;
    const usedPercent = toPercentOfQuota(totalBytes, quotaBytes);
    const usedLabel = `${formatBytes(totalBytes)} de ${formatBytes(quotaBytes)} · ${usedPercent}%`;

    return (
        <SettingsRow label="Espaço" description={describeStorage(usedPercent, usedLabel)}>
            <div
                aria-hidden="true"
                className="h-1.5 w-48 overflow-hidden rounded-full bg-foreground/10"
            >
                <div
                    className={cn(
                        "h-full rounded-full bg-primary",
                        usedPercent >= WARNING_PERCENT && "bg-destructive",
                    )}
                    style={{ width: `${Math.min(PERCENT, usedPercent)}%` }}
                />
            </div>
        </SettingsRow>
    );
}

function CrewRow({ stat }: { stat: CrewStat }): ReactNode {
    return (
        <SettingsRow
            art={<StageCrewMascot status={stat.stage} className={ROW_MASCOT_CLASS} />}
            label={ROW_LABELS[stat.stage] ?? capitalize(stat.label)}
            description={`${CREW_NAMES[stat.stage]} · ${stat.detail}`}
        >
            <span className="text-lg font-bold tracking-[-0.02em] tabular-nums">{stat.value}</span>
        </SettingsRow>
    );
}

/** The Uso group's rows: the disk out of the quota, then what each crew member already did. */
export function UsageRows(): ReactNode {
    const usageQuery = useQuery(usageQueryOptions());
    const usage = usageQuery.data;

    if (usageQuery.isError === true && usage === undefined) {
        return (
            <SettingsRow
                art={<StageCrewMascot status="failed" className={ROW_MASCOT_CLASS} />}
                label="Não foi possível carregar o uso"
                description="Tente de novo; se continuar, recarregue a página."
            >
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                        await usageQuery.refetch();
                    }}
                >
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </Button>
            </SettingsRow>
        );
    }

    if (usage === undefined) {
        return (
            <div role="status" aria-busy="true" className="grid gap-2 p-4 sm:p-5">
                <span className="sr-only">Carregando uso</span>
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
            </div>
        );
    }

    if (usage.videoCount === 0) {
        return (
            <SettingsRow
                art={<Mascot index={BRAND_MASCOT_INDEX} className={ROW_MASCOT_CLASS} />}
                label="A equipe ainda não trabalhou para você"
                description={`Adicione um vídeo e o ${HOST_NAME} chama a turma.`}
            >
                <NewVideoLink emphasis="secondary" />
            </SettingsRow>
        );
    }

    return (
        <>
            <StorageRow usage={usage} />
            {toCrewStats(usage).map((stat) => (
                <CrewRow key={stat.stage} stat={stat} />
            ))}
        </>
    );
}
