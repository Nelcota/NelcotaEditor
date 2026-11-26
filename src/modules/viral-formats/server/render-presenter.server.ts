import { writeFile } from "node:fs/promises";
import path from "node:path";
import { FRAME_HEIGHT, FRAME_WIDTH } from "#/modules/viral-formats/model/ass-overlay";
import type { PresenterPlan } from "#/modules/viral-formats/model/presenter-plan";
import { localFileInput } from "#/shared/server/local-media-input.server";
import { runCommand } from "#/shared/server/run-command.server";

export const FRAMES_PER_SECOND = "30";
export const PRESENTER_FILE_NAME = "presenter.mp4";
const OUTPUT_FILE_NAME = "output.mp4";
const OVERLAY_FILE_NAME = "presenter.ass";
const TIME_DECIMALS = 3;
const VOICE_LOUDNESS = "loudnorm=I=-14:TP=-1.5:LRA=11";
export const VIDEO_ENCODING = [
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-r",
    FRAMES_PER_SECOND,
];

interface RenderWorkspace {
    workDirectory: string;
    signal: AbortSignal;
}

export interface PresenterRenderInput extends RenderWorkspace {
    plan: PresenterPlan;
    rawVideoPath: string;
}

interface PresenterEffects {
    videoFilter?: string;
    soundSource?: string;
}

export function toRenderSeconds(value: number): string {
    return value.toFixed(TIME_DECIMALS);
}

export async function runFormatFfmpeg(
    args: Array<string>,
    workspace: RenderWorkspace,
): Promise<void> {
    await runCommand("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
        workingDirectory: workspace.workDirectory,
        signal: workspace.signal,
    });
}

function buildAudioFilters(soundSource: string | undefined): Array<string> {
    if (soundSource === undefined) {
        return [`[ca]${VOICE_LOUDNESS}[a]`];
    }

    return [
        `[ca]${VOICE_LOUDNESS},aresample=48000[voice]`,
        `${soundSource}[sound]`,
        "[voice][sound]amix=inputs=2:duration=first:normalize=0[a]",
    ];
}

function buildVideoFilters(effects: PresenterEffects | null): string {
    const filters = [
        `[cv]crop=w='min(iw,ih*9/16)':h='min(ih,iw*16/9)',scale=${FRAME_WIDTH}:${FRAME_HEIGHT},fps=${FRAMES_PER_SECOND},setsar=1`,
    ];

    if (effects?.videoFilter !== undefined) {
        filters.push(effects.videoFilter);
    }

    if (effects !== null) {
        filters.push(`ass=${OVERLAY_FILE_NAME}`);
    }

    return `${filters.join(",")}[v]`;
}

function buildPresenterFilter(plan: PresenterPlan, effects: PresenterEffects | null): string {
    const takes = plan.takes;
    const trims = takes.map(
        (take, index) =>
            `[0:v]trim=start=${toRenderSeconds(take.start)}:end=${toRenderSeconds(take.end)},setpts=PTS-STARTPTS[v${index}];` +
            `[0:a]atrim=start=${toRenderSeconds(take.start)}:end=${toRenderSeconds(take.end)},asetpts=PTS-STARTPTS[a${index}]`,
    );
    const concatInputs = takes.map((_take, index) => `[v${index}][a${index}]`).join("");
    return [
        ...trims,
        `${concatInputs}concat=n=${takes.length}:v=1:a=1[cv][ca]`,
        buildVideoFilters(effects),
        ...buildAudioFilters(effects?.soundSource),
    ].join(";");
}

/** The kept takes, one after the other, with a 9:16 crop and an even voice level. */
export async function cutPresenter(
    input: PresenterRenderInput,
    effects: PresenterEffects | null = null,
): Promise<string> {
    const filter = buildPresenterFilter(input.plan, effects);
    let outputName = PRESENTER_FILE_NAME;

    if (effects !== null) {
        outputName = OUTPUT_FILE_NAME;
    }

    await runFormatFfmpeg(
        [
            ...localFileInput(input.rawVideoPath),
            "-filter_complex",
            filter,
            "-map",
            "[v]",
            "-map",
            "[a]",
            ...VIDEO_ENCODING,
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-movflags",
            "+faststart",
            outputName,
        ],
        input,
    );

    return outputName;
}

export async function renderPresenterOverlay(
    input: PresenterRenderInput,
    overlay: string,
    effects: PresenterEffects = {},
): Promise<string> {
    const { workDirectory } = input;
    await writeFile(path.join(workDirectory, OVERLAY_FILE_NAME), overlay);
    const outputName = await cutPresenter(input, effects);

    return path.join(workDirectory, outputName);
}
