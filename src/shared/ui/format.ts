const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const MINUTES_PER_HOUR = 60;
const BYTES_PER_UNIT = 1024;
const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"];
// Server (UTC) and browser must agree on the day, or dates near midnight mismatch on hydration.
// Mirrors the server's business time zone, which lives in server-only code.
const DISPLAY_TIME_ZONE = "America/Sao_Paulo";

const wholeNumberFormatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const oneDecimalFormatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
// Keeps a number on the same line as its unit ("5 GB" never splits).
const NO_BREAK_SPACE = " ";

/** 75 → "1:15", 3725 → "1:02:05". */
export function formatClock(totalSeconds: number): string {
    if (Number.isFinite(totalSeconds) === false || totalSeconds < 0) {
        return "0:00";
    }

    const wholeSeconds = Math.round(totalSeconds);
    const hours = Math.floor(wholeSeconds / SECONDS_PER_HOUR);
    const minutes = Math.floor((wholeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const seconds = String(wholeSeconds % SECONDS_PER_MINUTE).padStart(2, "0");

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`;
    }

    return `${minutes}:${seconds}`;
}

/** 40 → "menos de 1 min", 200 → "cerca de 4 min", 4000 → "cerca de 1 h 7 min". */
export function formatTimeLeft(totalSeconds: number): string {
    if (Number.isFinite(totalSeconds) === false || totalSeconds < SECONDS_PER_MINUTE) {
        return `menos de 1${NO_BREAK_SPACE}min`;
    }

    const totalMinutes = Math.ceil(totalSeconds / SECONDS_PER_MINUTE);
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const minutes = totalMinutes % MINUTES_PER_HOUR;

    if (hours > 0) {
        return `cerca de ${hours}${NO_BREAK_SPACE}h ${minutes}${NO_BREAK_SPACE}min`;
    }

    return `cerca de ${totalMinutes}${NO_BREAK_SPACE}min`;
}

export function formatBytes(bytes: number): string {
    if (Number.isFinite(bytes) === false || bytes <= 0) {
        return "0 B";
    }

    // Fractions of a byte give a negative logarithm; they still read as bytes.
    const unitIndex = Math.min(
        BYTE_UNITS.length - 1,
        Math.max(0, Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT))),
    );
    const value = bytes / BYTES_PER_UNIT ** unitIndex;
    // Whole bytes have no decimals; larger units show one.
    let formatter = oneDecimalFormatter;

    if (unitIndex === 0) {
        formatter = wholeNumberFormatter;
    }

    const formattedValue = formatter.format(value);

    return `${formattedValue}${NO_BREAK_SPACE}${BYTE_UNITS[unitIndex] ?? "B"}`;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
});

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
});

/** "2026-11-19T20:41:00Z" → "19/11/2026". */
export function formatDate(isoDate: string): string {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime()) === true) {
        return "";
    }

    return dayFormatter.format(date);
}

const shortDayFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
});

/** "2026-11-19T20:41:00Z" → "19/11", for rows where the year is noise. */
export function formatShortDate(isoDate: string): string {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime()) === true) {
        return "";
    }

    return shortDayFormatter.format(date);
}

export function formatDateTime(isoDate: string): string {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime()) === true) {
        return "";
    }

    return dateFormatter.format(date);
}
