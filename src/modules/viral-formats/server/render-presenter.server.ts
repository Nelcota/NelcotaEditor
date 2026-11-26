import { FRAME_HEIGHT, FRAME_WIDTH } from "#/modules/viral-formats/model/ass-overlay";
import type { PresenterPlan } from "#/modules/viral-formats/model/presenter-plan";
import { localFileInput } from "#/shared/server/local-media-input.server";
import { runCommand } from "#/shared/server/run-command.server";

export const FRAMES_PER_SECOND = "30";
export const PRESENTER_FILE_NAME = "presenter.mp4";
const OUTPUT_FILE_NAME = "output.mp4";
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

function buildPresenterFilter(plan: PresenterPlan, overlayName: string | null): string {
    const takes = plan.takes;
    const trims = takes.map(
        (take, index) =>
            `[0:v]trim=start=${toRenderSeconds(take.start)}:end=${toRenderSeconds(take.end)},setpts=PTS-STARTPTS[v${index}];` +
            `[0:a]atrim=start=${toRenderSeconds(take.start)}:end=${toRenderSeconds(take.end)},asetpts=PTS-STARTPTS[a${index}]`,
    );
    const concatInputs = takes.map((_take, index) => `[v${index}][a${index}]`).join("");
    const videoFilters = [
        `[cv]crop=w='min(iw,ih*9/16)':h='min(ih,iw*16/9)',scale=${FRAME_WIDTH}:${FRAME_HEIGHT},fps=${FRAMES_PER_SECOND},setsar=1`,
    ];

    if (overlayName !== null) {
        videoFilters.push(`ass=${overlayName}`);
    }

    return [
        ...trims,
        `${concatInputs}concat=n=${takes.length}:v=1:a=1[cv][ca]`,
        `${videoFilters.join(",")}[v]`,
        `[ca]${VOICE_LOUDNESS}[a]`,
    ].join(";");
}

/** The kept takes, one after the other, with a 9:16 crop and an even voice level. */
export async function cutPresenter(
    input: PresenterRenderInput,
    overlayName: string | null = null,
): Promise<string> {
    const filter = buildPresenterFilter(input.plan, overlayName);
    let outputName = PRESENTER_FILE_NAME;

    if (overlayName !== null) {
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
