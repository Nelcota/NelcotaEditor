import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { localFileInput } from "#/shared/server/local-media-input.server";
import { runCommand } from "#/shared/server/run-command.server";

/**
 * Short chunks keep each Whisper request well below HTTP timeouts, report progress often and
 * spread evenly over the parallel Whisper workers (2-minute chunks beat 5-minute ones by 2x).
 */
export const AUDIO_CHUNK_SECONDS = 120;

// Whisper works on 16 kHz mono audio; giving it exactly that skips a resample on the server.
const WHISPER_SAMPLE_RATE_HERTZ = 16_000;
const MONO_CHANNEL_COUNT = 1;
const CHUNK_FILE_PATTERN = "chunk-%04d.wav";
const CHUNK_FILE_EXTENSION = ".wav";

export interface AudioChunk {
    absolutePath: string;
    offsetSeconds: number;
}

function buildSplitArguments(sourceAbsolutePath: string, outputDirectory: string): Array<string> {
    return [
        "-y",
        ...localFileInput(sourceAbsolutePath),
        "-vn",
        "-ac",
        String(MONO_CHANNEL_COUNT),
        "-ar",
        String(WHISPER_SAMPLE_RATE_HERTZ),
        "-c:a",
        "pcm_s16le",
        "-f",
        "segment",
        "-segment_time",
        String(AUDIO_CHUNK_SECONDS),
        path.join(outputDirectory, CHUNK_FILE_PATTERN),
    ];
}

async function listChunks(outputDirectory: string): Promise<Array<AudioChunk>> {
    const entries = await readdir(outputDirectory);
    // The zero-padded names sort in playback order, which is what the offsets rely on.
    const fileNames = entries.filter((name) => name.endsWith(CHUNK_FILE_EXTENSION)).toSorted();

    return fileNames.map((fileName, index) => ({
        absolutePath: path.join(outputDirectory, fileName),
        offsetSeconds: index * AUDIO_CHUNK_SECONDS,
    }));
}

/** Splits the audio into 16 kHz mono WAV chunks, which is what Whisper works with. */
export async function extractAudioChunks(
    sourceAbsolutePath: string,
    outputDirectory: string,
    signal: AbortSignal,
): Promise<Array<AudioChunk>> {
    if (sourceAbsolutePath.trim().length === 0) {
        throw new RangeError("Cannot extract audio without a source file path");
    }

    // The directory is wiped first, so a relative or empty path could delete the wrong folder.
    if (path.isAbsolute(outputDirectory) === false) {
        throw new RangeError(`Audio output directory must be absolute, got "${outputDirectory}"`);
    }

    await rm(outputDirectory, { recursive: true, force: true });
    await mkdir(outputDirectory, { recursive: true });
    await runCommand("ffmpeg", buildSplitArguments(sourceAbsolutePath, outputDirectory), {
        signal,
    });

    return listChunks(outputDirectory);
}
