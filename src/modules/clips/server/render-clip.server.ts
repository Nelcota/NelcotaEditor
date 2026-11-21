import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { buildAssSubtitles } from "#/modules/clips/build-ass-subtitles";
import {
    groupWordsIntoCues,
    toClipRelativeCues,
    wordsInsideRange,
} from "#/modules/clips/caption-cues";
import type { CaptionCue } from "#/modules/clips/clip-studio.schema";
import { ASPECT_RATIO_SIZES } from "#/modules/clips/clip-format";
import type { AspectRatio } from "#/modules/clips/clip-format";
import type { ClipStatus } from "#/modules/clips/clip-status";
import { clips } from "#/modules/clips/clips.schema";
import type { Clip } from "#/modules/clips/clips.schema";
import type { TranscriptWord } from "#/modules/transcription/transcript-word";
import { localFileInput } from "#/shared/server/local-media-input.server";
import { runCommand } from "#/shared/server/run-command.server";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";

const TIME_DECIMALS = 3;
const CLIPS_DIRECTORY_NAME = "clips";
// Center crop to the chosen shape (works for landscape and portrait sources), then scale to size.
const CROP_FILTERS: Record<AspectRatio, string> = {
    vertical: "crop=w='min(iw,ih*9/16)':h='min(ih,iw*16/9)'",
    square: "crop=w='min(iw,ih)':h='min(iw,ih)'",
    horizontal: "crop=w='min(iw,ih*16/9)':h='min(ih,iw*9/16)'",
};
const VIDEO_CODEC = "libx264";
// "veryfast" with CRF 21 keeps social-media quality while rendering several clips per minute.
const ENCODER_PRESET = "veryfast";
const CONSTANT_RATE_FACTOR = "21";
const PIXEL_FORMAT = "yuv420p";
const AUDIO_CODEC = "aac";
const AUDIO_BITRATE = "160k";

export interface RenderClipInput {
    clip: Clip;
    sourcePath: string;
    words: Array<TranscriptWord>;
    signal: AbortSignal;
}

export class InvalidClipRangeError extends Error {
    constructor(clip: Clip) {
        super(`Clip ${clip.id} has an invalid range: ${clip.startSeconds} to ${clip.endSeconds}`);
        this.name = "InvalidClipRangeError";
    }
}

function assertValidRange(clip: Clip): void {
    const startSeconds = clip.startSeconds;
    const endSeconds = clip.endSeconds;

    if (Number.isFinite(startSeconds) === false || Number.isFinite(endSeconds) === false) {
        throw new InvalidClipRangeError(clip);
    }

    if (startSeconds < 0 || endSeconds <= startSeconds) {
        throw new InvalidClipRangeError(clip);
    }
}

/** The Studio's edited captions when there are any; otherwise the transcript, grouped. */
function resolveClipCues(clip: Clip, words: Array<TranscriptWord>): Array<CaptionCue> {
    const editedCues = clip.captionCues;

    if (editedCues !== null) {
        return editedCues;
    }

    return groupWordsIntoCues(wordsInsideRange(words, clip));
}

function buildVideoFilter(clip: Clip): string {
    const { width, height } = ASPECT_RATIO_SIZES[clip.aspectRatio];
    const shapeFilter = `${CROP_FILTERS[clip.aspectRatio]},scale=${width}:${height},setsar=1`;

    if (clip.captionStyle === "none") {
        return shapeFilter;
    }

    return `${shapeFilter},ass=${clip.id}.ass`;
}

function buildFfmpegArguments(clip: Clip, sourceAbsolutePath: string): Array<string> {
    const durationSeconds = clip.endSeconds - clip.startSeconds;

    return [
        "-y",
        "-ss",
        clip.startSeconds.toFixed(TIME_DECIMALS),
        ...localFileInput(sourceAbsolutePath),
        "-t",
        durationSeconds.toFixed(TIME_DECIMALS),
        "-vf",
        buildVideoFilter(clip),
        "-c:v",
        VIDEO_CODEC,
        "-preset",
        ENCODER_PRESET,
        "-crf",
        CONSTANT_RATE_FACTOR,
        "-pix_fmt",
        PIXEL_FORMAT,
        "-c:a",
        AUDIO_CODEC,
        "-b:a",
        AUDIO_BITRATE,
        "-movflags",
        "+faststart",
        `${clip.id}.mp4`,
    ];
}

/** Renders one clip in its chosen shape with burned-in captions (unless the style is none) and stores its relative path. */
export async function renderClip(input: RenderClipInput): Promise<void> {
    const clip = input.clip;
    assertValidRange(clip);

    const clipsDirectory = path.posix.join(getVideoDirectory(clip.videoId), CLIPS_DIRECTORY_NAME);
    const workingDirectory = resolveStoragePath(clipsDirectory);
    const subtitlesFile = path.join(workingDirectory, `${clip.id}.ass`);

    await mkdir(workingDirectory, { recursive: true });

    if (clip.captionStyle !== "none") {
        const cues = toClipRelativeCues(resolveClipCues(clip, input.words), clip.startSeconds);

        await writeFile(
            subtitlesFile,
            buildAssSubtitles(cues, {
                aspectRatio: clip.aspectRatio,
                style: clip.captionStyle,
                color: clip.captionColor,
                size: clip.captionSize,
                position: clip.captionPosition,
                font: clip.captionFont,
            }),
        );
    }

    try {
        // The working directory keeps the ass filter argument free of path escaping issues.
        await runCommand(
            "ffmpeg",
            buildFfmpegArguments(clip, resolveStoragePath(input.sourcePath)),
            {
                workingDirectory,
                signal: input.signal,
            },
        );
    } finally {
        // A failed or cancelled render must not leave the subtitles behind.
        await rm(subtitlesFile, { force: true });
    }

    const outputPath = path.posix.join(clipsDirectory, `${clip.id}.mp4`);
    await db.update(clips).set({ status: "done", outputPath }).where(eq(clips.id, clip.id));
}

export async function setClipStatus(clipId: string, status: ClipStatus): Promise<void> {
    await db.update(clips).set({ status }).where(eq(clips.id, clipId));
}
