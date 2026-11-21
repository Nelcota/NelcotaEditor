import { useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import {
    DEFAULT_OVERVIEW_PERIOD_DAYS,
    OVERVIEW_PERIOD_DAYS,
} from "#/modules/overview/overview-period";
import type { OverviewPeriodDays } from "#/modules/overview/overview-period";
import { OverviewBoard } from "#/modules/overview/ui/overview-board";
import { overviewQueryOptions } from "#/modules/overview/ui/overview-queries";
import { OverviewLoadError, OverviewLoading } from "#/modules/overview/ui/overview-states";
import { PeriodPicker } from "#/modules/overview/ui/period-picker";
import { FirstVideoEmptyState } from "#/modules/videos/ui/video-list-states";
import { PageHeader } from "#/shared/ui/page-header";

const overviewRoute = getRouteApi("/_app/overview");

/** Switches to the next longer period; null when this is already the longest. */
function createWiden(
    periodDays: OverviewPeriodDays,
    onPeriodChange: (periodDays: OverviewPeriodDays) => void,
): (() => void) | null {
    const longer = OVERVIEW_PERIOD_DAYS.find((candidate) => candidate > periodDays);

    if (longer === undefined) {
        return null;
    }

    return () => onPeriodChange(longer);
}

/** The default period stays out of the URL. */
function toPeriodSearch(periodDays: OverviewPeriodDays): OverviewPeriodDays | undefined {
    if (periodDays === DEFAULT_OVERVIEW_PERIOD_DAYS) {
        return undefined;
    }

    return periodDays;
}

interface OverviewContentProps {
    periodDays: OverviewPeriodDays;
    onPeriodChange: (periodDays: OverviewPeriodDays) => void;
}

function OverviewContent({ periodDays, onPeriodChange }: OverviewContentProps) {
    const overviewQuery = useQuery(overviewQueryOptions(periodDays));
    const stats = overviewQuery.data;

    if (overviewQuery.isError === true && stats === undefined) {
        return (
            <OverviewLoadError
                onRetry={async () => {
                    await overviewQuery.refetch();
                }}
            />
        );
    }

    if (stats === undefined) {
        return <OverviewLoading />;
    }

    if (stats.hasAnyVideo === false) {
        return <FirstVideoEmptyState />;
    }

    return (
        <OverviewBoard
            stats={stats}
            isStale={overviewQuery.isPlaceholderData}
            onWiden={createWiden(periodDays, onPeriodChange)}
        />
    );
}

export function OverviewScreen() {
    const search = overviewRoute.useSearch();
    const navigate = useNavigate();
    const periodDays = search.period ?? DEFAULT_OVERVIEW_PERIOD_DAYS;
    const changePeriod = async (next: OverviewPeriodDays) => {
        await navigate({ to: "/overview", search: { period: toPeriodSearch(next) } });
    };

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <PageHeader
                title="Painel"
                description="Quanto você enviou, quantos cortes saíram e como foi cada etapa."
                action={<PeriodPicker value={periodDays} onChange={changePeriod} />}
            />
            <OverviewContent periodDays={periodDays} onPeriodChange={changePeriod} />
        </div>
    );
}
