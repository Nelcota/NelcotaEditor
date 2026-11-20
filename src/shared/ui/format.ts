const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const MINUTES_PER_HOUR = 60;
const BYTES_PER_UNIT = 1024;
const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"];

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
        return "menos de 1 min";
    }

    const totalMinutes = Math.ceil(totalSeconds / SECONDS_PER_MINUTE);
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const minutes = totalMinutes % MINUTES_PER_HOUR;

    if (hours > 0) {
        return `cerca de ${hours} h ${minutes} min`;
    }

    return `cerca de ${totalMinutes} min`;
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
    const decimals = Math.min(1, unitIndex);

    return `${value.toFixed(decimals)} ${BYTE_UNITS[unitIndex] ?? "B"}`;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

/** "2026-11-19T20:41:00Z" → "19/11/2026". */
export function formatDate(isoDate: string): string {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime()) === true) {
        return "";
    }

    return dayFormatter.format(date);
}

export function formatDateTime(isoDate: string): string {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime()) === true) {
        return "";
    }

    return dateFormatter.format(date);
}
