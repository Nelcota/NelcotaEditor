import path from "node:path";
import { z } from "zod";
import { runCommand } from "#/shared/server/run-command.server";

// ffprobe prints numbers as strings ("12.345000") and "N/A" when unknown, which coerces to NaN and fails.
const probeOutputSchema = z.object({
    format: z.object({ duration: z.coerce.number().nonnegative() }),
    streams: z.array(z.object({ codec_type: z.string() })),
});

type ProbeOutput = z.infer<typeof probeOutputSchema>;

export interface MediaInfo {
    durationSeconds: number;
    hasVideo: boolean;
    hasAudio: boolean;
}

export class MediaProbeError extends Error {
    constructor(absolutePath: string, options?: ErrorOptions) {
        super(`Could not read media information from ${absolutePath}`, options);
        this.name = "MediaProbeError";
    }
}

function parseProbeOutput(output: string, absolutePath: string): ProbeOutput {
    let json: unknown = null;

    try {
        json = JSON.parse(output);
    } catch (error) {
        throw new MediaProbeError(absolutePath, { cause: error });
    }

    const result = probeOutputSchema.safeParse(json);

    if (result.success === false) {
        throw new MediaProbeError(absolutePath, { cause: result.error });
    }

    return result.data;
}

export async function probeMedia(absolutePath: string): Promise<MediaInfo> {
    // A relative path such as "-i" would be read by ffprobe as an option.
    if (path.isAbsolute(absolutePath) === false) {
        throw new MediaProbeError(absolutePath);
    }

    const output = await runCommand("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=codec_type",
        "-of",
        "json",
        absolutePath,
    ]);
    const probe = parseProbeOutput(output, absolutePath);
    const streamTypes = probe.streams.map((stream) => stream.codec_type);

    return {
        durationSeconds: probe.format.duration,
        hasVideo: streamTypes.includes("video"),
        hasAudio: streamTypes.includes("audio"),
    };
}
