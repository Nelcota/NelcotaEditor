import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import {
    DEFAULT_OVERVIEW_PERIOD_DAYS,
    OVERVIEW_PERIOD_DAYS,
} from "#/modules/overview/model/overview-period";
import type { OverviewPeriodDays } from "#/modules/overview/model/overview-period";
import { OverviewBoard } from "#/modules/overview/ui/components/overview-board";
import { overviewQueryOptions } from "#/modules/overview/model/overview-queries";
import {
    OverviewLoadError,
    OverviewLoading,
} from "#/modules/overview/ui/components/overview-states";
import { PeriodPicker } from "#/modules/overview/ui/components/period-picker";
import { PageHeader } from "#/shared/ui/page-header";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

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
    firstVideoEmptyState: ReactNode;
}

function OverviewContent({
    periodDays,
    onPeriodChange,
    firstVideoEmptyState,
}: OverviewContentProps) {
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
        return firstVideoEmptyState;
    }

    return (
        <OverviewBoard
            stats={stats}
            isStale={overviewQuery.isPlaceholderData}
            onWiden={createWiden(periodDays, onPeriodChange)}
        />
    );
}

/** The Vídeos module owns the first-video welcome, so the route hands it in. */
export function OverviewScreen({ firstVideoEmptyState }: { firstVideoEmptyState: ReactNode }) {
    const track = useTrackPromise();
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
                action={
                    <PeriodPicker
                        value={periodDays}
                        onChange={(next) => track(changePeriod(next))}
                    />
                }
            />
            <OverviewContent
                periodDays={periodDays}
                onPeriodChange={(next) => track(changePeriod(next))}
                firstVideoEmptyState={firstVideoEmptyState}
            />
        </div>
    );
}
