const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const integerFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export const EMPTY_VALUE = "—";

export function formatInteger(value: number): string {
    if (Number.isFinite(value) === false) {
        return EMPTY_VALUE;
    }

    return integerFormatter.format(value);
}

/** 42 → "42 s", 402 → "6 min 42 s", 3780 → "1 h 3 min". */
export function formatDuration(totalSeconds: number): string {
    if (Number.isFinite(totalSeconds) === false || totalSeconds < 0) {
        return EMPTY_VALUE;
    }

    const wholeSeconds = Math.round(totalSeconds);
    const hours = Math.floor(wholeSeconds / SECONDS_PER_HOUR);
    const minutes = Math.floor((wholeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const seconds = wholeSeconds % SECONDS_PER_MINUTE;

    if (hours > 0) {
        return `${hours} h ${minutes} min`;
    }

    if (minutes > 0) {
        return `${minutes} min ${seconds} s`;
    }

    return `${seconds} s`;
}

/** "2026-11-12" → "12/11". */
export function formatDayLabel(isoDate: string): string {
    const parts = isoDate.split("-");

    if (parts.length !== 3) {
        return isoDate;
    }

    return `${parts[2]}/${parts[1]}`;
}
