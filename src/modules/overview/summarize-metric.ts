import type { MetricView } from "#/modules/overview/overview-views";

type Aggregate = "sum" | "average";

function sumValues(values: Array<number>): number {
    return values.reduce((total, value) => total + value, 0);
}

function averageValues(values: Array<number>): number | null {
    if (values.length === 0) {
        return null;
    }

    return sumValues(values) / values.length;
}

const AGGREGATES: Record<Aggregate, (values: Array<number>) => number | null> = {
    sum: sumValues,
    average: averageValues,
};

/** Turns day buckets (previous period first, then the current one) into a metric. */
export function summarizeMetric(buckets: Array<Array<number>>, aggregate: Aggregate): MetricView {
    const combine = AGGREGATES[aggregate];
    const periodDays = buckets.length / 2;
    const previousBuckets = buckets.slice(0, periodDays);
    const currentBuckets = buckets.slice(periodDays);

    return {
        current: combine(currentBuckets.flat()),
        previous: combine(previousBuckets.flat()),
        daily: currentBuckets.map(combine),
    };
}

/** Running total of each day's count. */
export function accumulate(counts: Array<number>): Array<number> {
    let total = 0;

    return counts.map((count) => {
        total += count;
        return total;
    });
}
