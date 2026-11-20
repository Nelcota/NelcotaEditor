const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const TIME_DECIMALS = 1;
const TENTHS_PER_SECOND = 10;
const CLOCK_PATTERN = /^\d+(?::\d{1,2}){0,2}(?:[.,]\d+)?$/;

/** 75.4 → "1:15.4", so a clip edge keeps its tenths when the text goes back to seconds. */
export function formatPreciseClock(totalSeconds: number): string {
    if (Number.isFinite(totalSeconds) === false || totalSeconds < 0) {
        return "0:00.0";
    }

    // Rounded first, so 59.96 becomes "1:00.0" and never "0:60.0".
    const tenths = Math.round(totalSeconds * TENTHS_PER_SECOND);
    const minutesTotal = Math.floor(tenths / (SECONDS_PER_MINUTE * TENTHS_PER_SECOND));
    const seconds =
        (tenths - minutesTotal * SECONDS_PER_MINUTE * TENTHS_PER_SECOND) / TENTHS_PER_SECOND;
    const secondsText = seconds.toFixed(TIME_DECIMALS).padStart(TIME_DECIMALS + 3, "0");

    return `${minutesTotal}:${secondsText}`;
}

/**
 * Reads "75", "75.5", "1:15" or "1:02:05.5" as seconds. Returns null for anything else, so the
 * form can say the time is not understood instead of guessing.
 */
export function parseClockInput(text: string): number | null {
    const trimmed = text.trim();

    if (CLOCK_PATTERN.test(trimmed) === false) {
        return null;
    }

    const parts = trimmed.replace(",", ".").split(":").map(Number);
    const hasInvalidPart = parts.some((part) => Number.isFinite(part) === false);

    if (hasInvalidPart === true) {
        return null;
    }

    // After the first part, minutes and seconds only go up to 59: "1:75" is a typo, not 2:15.
    const hasOutOfRangePart = parts.slice(1).some((part) => part >= SECONDS_PER_MINUTE);

    if (hasOutOfRangePart === true) {
        return null;
    }

    const multipliers = [1, SECONDS_PER_MINUTE, SECONDS_PER_HOUR];
    const reversedParts = parts.toReversed();

    return reversedParts.reduce(
        (total, part, index) => total + part * (multipliers[index] ?? 0),
        0,
    );
}
