import { z } from "zod";

export const FORMATS_MARKER = "NELCOTA_FORMATS ";
export const PROGRESS_MARKER = "NELCOTA_PROGRESS ";

const formatIdsSchema = z.union([z.string(), z.array(z.string()).min(1)]);
const progressSchema = z.tuple([z.string(), z.number().nonnegative()]);
const PERCENT = 100;

function readJson(line: string): unknown {
    try {
        const value: unknown = JSON.parse(line);
        return value;
    } catch {
        return null;
    }
}

function readFormats(line: string): Array<string> {
    const result = formatIdsSchema.safeParse(readJson(line.slice(FORMATS_MARKER.length)));

    if (result.success === false) {
        return [];
    }

    if (typeof result.data === "string") {
        return [result.data];
    }

    return result.data;
}

export function createYoutubeDownloadProgressParser(
    onProgress: (percent: number) => void,
): (line: string) => void {
    let formatIds: Array<string> = [];
    const progressByFormat = new Map<string, number>();

    return (line: string): void => {
        if (line.startsWith(FORMATS_MARKER)) {
            formatIds = readFormats(line);
            progressByFormat.clear();
            return;
        }

        if (line.startsWith(PROGRESS_MARKER) === false || formatIds.length === 0) {
            return;
        }

        const result = progressSchema.safeParse(readJson(line.slice(PROGRESS_MARKER.length)));

        if (result.success === true) {
            reportFormatProgress({ formatIds, progressByFormat, onProgress }, result.data);
        }
    };
}

interface FormatProgress {
    formatIds: Array<string>;
    progressByFormat: Map<string, number>;
    onProgress: (percent: number) => void;
}

function reportFormatProgress(progress: FormatProgress, [formatId, value]: [string, number]): void {
    const { formatIds, progressByFormat, onProgress } = progress;

    if (formatIds.includes(formatId) === false) {
        return;
    }

    const percent = Math.min(PERCENT, value);

    if (percent <= (progressByFormat.get(formatId) ?? 0)) {
        return;
    }

    progressByFormat.set(formatId, percent);
    const total = formatIds.reduce((sum, id) => sum + (progressByFormat.get(id) ?? 0), 0);
    onProgress(total / formatIds.length);
}
