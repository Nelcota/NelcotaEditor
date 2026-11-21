import { mkdir } from "node:fs/promises";
import path from "node:path";
import { MAX_VIDEO_DURATION_SECONDS } from "#/modules/videos/video-status";
import type { Video } from "#/modules/videos/videos.schema";
import { CommandFailedError, runCommand } from "#/shared/server/run-command.server";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const MAX_FILE_SIZE = "4G";
const FORMAT_SELECTOR = "bv*[height<=1080]+ba/b[height<=1080]/b";
// H.264 decodes several times faster than AV1/VP9 on CPU, which speeds up every render.
const FORMAT_SORT = "vcodec:h264,res:1080,acodec:m4a";
const CONCURRENT_FRAGMENTS = "4";
const TITLE_MARKER = "NELCOTA_TITLE ";
const FILE_MARKER = "NELCOTA_FILE ";
const PROGRESS_MARKER = "NELCOTA_PROGRESS ";
const PERCENT_PATTERN = /(\d+(?:\.\d+)?)%/;
const OUTPUT_FILE_TEMPLATE = "source.%(ext)s";
const MERGE_OUTPUT_FORMAT = "mp4";

export interface DownloadedVideo {
    sourcePath: string;
    title: string;
}

interface DownloadOptions {
    signal: AbortSignal;
    onProgress: (percent: number) => void;
}

function buildYtDlpArguments(url: string, outputTemplate: string): Array<string> {
    return [
        "--no-playlist",
        // Second guard behind the server schema: never walk more than one entry of a list.
        "--playlist-items",
        "1",
        "--js-runtimes",
        "node",
        "--format",
        FORMAT_SELECTOR,
        "--format-sort",
        FORMAT_SORT,
        "--concurrent-fragments",
        CONCURRENT_FRAGMENTS,
        "--merge-output-format",
        MERGE_OUTPUT_FORMAT,
        "--max-filesize",
        MAX_FILE_SIZE,
        "--match-filter",
        `duration <= ${MAX_VIDEO_DURATION_SECONDS}`,
        "--output",
        outputTemplate,
        "--progress",
        "--newline",
        "--progress-template",
        `download:${PROGRESS_MARKER}%(progress._percent_str)s`,
        "--print",
        `after_move:${TITLE_MARKER}%(title)s`,
        "--print",
        `after_move:${FILE_MARKER}%(filepath)s`,
        "--",
        url,
    ];
}

/** yt-dlp downloads video and audio one after the other; showing the maximum keeps the bar monotonic. */
function createProgressParser(onProgress: (percent: number) => void): (line: string) => void {
    let highestPercent = 0;

    return (line: string) => {
        if (line.includes(PROGRESS_MARKER) === false) {
            return;
        }

        const match = PERCENT_PATTERN.exec(line);

        if (match === null) {
            return;
        }

        const percent = Number(match[1]);

        if (Number.isFinite(percent) === false || percent <= highestPercent) {
            return;
        }

        highestPercent = percent;
        onProgress(percent);
    };
}

async function runYtDlp(
    url: string,
    outputTemplate: string,
    options: DownloadOptions,
): Promise<string> {
    try {
        return await runCommand("yt-dlp", buildYtDlpArguments(url, outputTemplate), {
            signal: options.signal,
            onOutputLine: createProgressParser(options.onProgress),
        });
    } catch (error) {
        if (error instanceof CommandFailedError) {
            throw new UserFacingError(
                "Não foi possível baixar o vídeo do YouTube. Confira se o vídeo é público ou não listado e tente de novo.",
                { cause: error },
            );
        }

        throw error;
    }
}

function readMarkedLine(output: string, marker: string): string | null {
    const line = output.split("\n").find((candidate) => candidate.startsWith(marker));

    if (line === undefined) {
        return null;
    }

    return line.slice(marker.length).trim();
}

export async function downloadYoutubeVideo(
    video: Video,
    options: DownloadOptions,
): Promise<DownloadedVideo> {
    const sourceUrl = video.sourceUrl;

    if (sourceUrl === null) {
        throw new UserFacingError("Este vídeo não tem link do YouTube.");
    }

    const videoDirectory = getVideoDirectory(video.id);
    const absoluteVideoDirectory = resolveStoragePath(videoDirectory);
    await mkdir(absoluteVideoDirectory, { recursive: true });

    const outputTemplate = path.join(absoluteVideoDirectory, OUTPUT_FILE_TEMPLATE);
    const output = await runYtDlp(sourceUrl, outputTemplate, options);
    const downloadedFile = readMarkedLine(output, FILE_MARKER);

    if (downloadedFile === null) {
        throw new UserFacingError(
            "O vídeo é longo demais (máximo 3 horas) ou não está disponível.",
        );
    }

    return {
        sourcePath: path.posix.join(videoDirectory, path.basename(downloadedFile)),
        title: readMarkedLine(output, TITLE_MARKER) ?? video.title,
    };
}
