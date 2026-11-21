/**
 * Days and months in reports follow the users' clock, not UTC or the server's: a clip made at
 * 22:00 in Brazil belongs to that day. Decision of 2026-11-21 (see docs/ROADMAP.md).
 */
export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

const DATE_PARTS_FORMAT = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
});

interface ZonedParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}

function readZonedParts(date: Date): ZonedParts {
    const values = new Map(
        DATE_PARTS_FORMAT.formatToParts(date).map((part) => [part.type, Number(part.value)]),
    );

    return {
        year: values.get("year") ?? Number.NaN,
        month: values.get("month") ?? Number.NaN,
        day: values.get("day") ?? Number.NaN,
        hour: values.get("hour") ?? Number.NaN,
        minute: values.get("minute") ?? Number.NaN,
        second: values.get("second") ?? Number.NaN,
    };
}

/** How far the zone's wall clock is from UTC at that instant (negative west of Greenwich). */
function offsetMilliseconds(date: Date): number {
    const parts = readZonedParts(date);
    const wallClockAsUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
    );
    const wholeSeconds = Math.floor(date.getTime() / 1000) * 1000;

    return wallClockAsUtc - wholeSeconds;
}

/** The instant the zone's calendar day containing `date` began. */
export function startOfBusinessDay(date: Date): Date {
    const parts = readZonedParts(date);
    const midnightAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day);

    return new Date(midnightAsUtc - offsetMilliseconds(new Date(midnightAsUtc)));
}

/** The instant the zone's calendar month containing `date` began. */
export function startOfBusinessMonth(date: Date): Date {
    const parts = readZonedParts(date);
    const firstAsUtc = Date.UTC(parts.year, parts.month - 1, 1);

    return new Date(firstAsUtc - offsetMilliseconds(new Date(firstAsUtc)));
}

/** "2026-11-21" for the zone's calendar day of `date`. */
export function toBusinessDayKey(date: Date): string {
    const parts = readZonedParts(date);
    const month = String(parts.month).padStart(2, "0");
    const day = String(parts.day).padStart(2, "0");

    return `${parts.year}-${month}-${day}`;
}
