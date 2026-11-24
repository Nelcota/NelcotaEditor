import { tz } from "@date-fns/tz";
import { addDays, differenceInCalendarDays, format, startOfDay, startOfMonth } from "date-fns";

/**
 * Days and months in reports follow the users' clock, not UTC or the server's: a clip made at
 * 22:00 in Brazil belongs to that day. Decision of 2026-11-21 (see docs/ROADMAP.md).
 */
export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

const IN_BUSINESS_ZONE = { in: tz(BUSINESS_TIME_ZONE) };

/**
 * date-fns answers with a TZDate, whose toISOString carries the zone offset; callers and the
 * database expect a plain UTC Date.
 */
function toPlainDate(date: Date): Date {
    return new Date(date.getTime());
}

/** The instant the zone's calendar day containing `date` began. */
export function startOfBusinessDay(date: Date): Date {
    return toPlainDate(startOfDay(date, IN_BUSINESS_ZONE));
}

/** The instant the zone's calendar month containing `date` began. */
export function startOfBusinessMonth(date: Date): Date {
    return toPlainDate(startOfMonth(date, IN_BUSINESS_ZONE));
}

/** `date` moved by whole calendar days in the zone (negative goes back). */
export function addBusinessDays(date: Date, days: number): Date {
    return toPlainDate(addDays(date, days, IN_BUSINESS_ZONE));
}

/** Calendar days in the zone from `earlier` to `later`, ignoring the time of day. */
export function countBusinessDaysBetween(later: Date, earlier: Date): number {
    return differenceInCalendarDays(later, earlier, IN_BUSINESS_ZONE);
}

/** "2026-11-21" for the zone's calendar day of `date`. */
export function toBusinessDayKey(date: Date): string {
    return format(date, "yyyy-MM-dd", IN_BUSINESS_ZONE);
}
