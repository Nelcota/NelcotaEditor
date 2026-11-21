const SECONDS_PER_HOUR = 3600;

const integerFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const hoursFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function formatCount(value: number): string {
    if (Number.isFinite(value) === false) {
        return "0";
    }

    return integerFormatter.format(value);
}

/** 5400 → "1,5 h": totals across every account are read in hours, not clock time. */
export function formatHours(totalSeconds: number): string {
    if (Number.isFinite(totalSeconds) === false || totalSeconds <= 0) {
        return "0 h";
    }

    return `${hoursFormatter.format(totalSeconds / SECONDS_PER_HOUR)} h`;
}
