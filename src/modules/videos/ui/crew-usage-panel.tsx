import { useQuery } from "@tanstack/react-query";
import { CrewStatTile, STAT_GRID_CLASS } from "#/modules/videos/ui/crew-stat-tile";
import { toCrewStats } from "#/modules/videos/ui/crew-stats";
import { NoUsageYet, UsageError, UsageLoading } from "#/modules/videos/ui/crew-usage-states";
import { usageQueryOptions } from "#/modules/videos/ui/library-queries";
import { StorageBreakdown } from "#/modules/videos/ui/storage-breakdown";

/** The usage, told as what each crew member already did, plus where the disk space goes. */
export function CrewUsagePanel() {
    const usageQuery = useQuery(usageQueryOptions());
    const usage = usageQuery.data;

    if (usageQuery.isError === true && usage === undefined) {
        return (
            <UsageError
                onRetry={async () => {
                    await usageQuery.refetch();
                }}
            />
        );
    }

    if (usage === undefined) {
        return <UsageLoading />;
    }

    if (usage.videoCount === 0) {
        return <NoUsageYet />;
    }

    return (
        <div className="grid gap-3 @container">
            <dl className={STAT_GRID_CLASS}>
                {toCrewStats(usage).map((stat) => (
                    <CrewStatTile key={stat.stage} stat={stat} />
                ))}
            </dl>
            <StorageBreakdown
                storage={usage.storage}
                quotaBytes={usage.storageQuotaBytes}
                videoCount={usage.videoCount}
            />
        </div>
    );
}
