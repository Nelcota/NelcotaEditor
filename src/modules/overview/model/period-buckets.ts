import {
    addBusinessDays,
    countBusinessDaysBetween,
    startOfBusinessDay,
    toBusinessDayKey,
} from "#/shared/server/business-time-zone";

/**
 * The current period and the one before it, as 2 × periodDays days ending today, counted in the
 * business time zone (São Paulo), not UTC. Today is only partly over, so the previous period
 * stops at the same time of day (`previousEnd`) and sums compare like for like.
 */
export interface PeriodWindow {
    periodDays: number;
    previousStart: Date;
    previousEnd: Date;
}

export class InvalidPeriodError extends Error {
    constructor(periodDays: number) {
        super(`Invalid overview period: ${String(periodDays)} days`);
        this.name = "InvalidPeriodError";
    }
}

export function createPeriodWindow(periodDays: number, now: Date): PeriodWindow {
    if (Number.isInteger(periodDays) === false || periodDays <= 0) {
        throw new InvalidPeriodError(periodDays);
    }

    const today = startOfBusinessDay(now);
    const previousStart = addBusinessDays(today, -(periodDays * 2 - 1));
    const previousEnd = addBusinessDays(now, -periodDays);

    return { periodDays, previousStart, previousEnd };
}

/** Day index in the window (0 … 2 × periodDays − 1), or null when the date is outside it. */
export function findDayIndex(window: PeriodWindow, date: Date): number | null {
    const periodDays = window.periodDays;
    const index = countBusinessDaysBetween(date, window.previousStart);

    if (index < 0 || index >= periodDays * 2) {
        return null;
    }

    if (index < periodDays && date.getTime() >= window.previousEnd.getTime()) {
        return null;
    }

    return index;
}

export function listCurrentDays(window: PeriodWindow): Array<string> {
    const currentStart = addBusinessDays(window.previousStart, window.periodDays);

    return Array.from({ length: window.periodDays }, (_, offset) =>
        toBusinessDayKey(addBusinessDays(currentStart, offset)),
    );
}

/** Groups values by day of the window; each slot holds the values of that day. */
export function bucketByDay<Item>(
    window: PeriodWindow,
    items: Array<Item>,
    pick: (item: Item) => { date: Date | null; value: number } | null,
): Array<Array<number>> {
    const buckets: Array<Array<number>> = Array.from({ length: window.periodDays * 2 }, () => []);

    for (const item of items) {
        const picked = pick(item);

        if (picked === null || picked.date === null) {
            continue;
        }

        const index = findDayIndex(window, picked.date);

        if (index === null) {
            continue;
        }

        buckets[index]?.push(picked.value);
    }

    return buckets;
}
