import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import {
    BOTTOM_PANEL_HEIGHT,
    FRAME_HEIGHT,
    FRAME_WIDTH,
    TOP_PANEL_HEIGHT,
    buildWordCaptions,
} from "#/modules/viral-formats/model/split-screen-captions";
import type { SplitScreenPlan } from "#/modules/viral-formats/model/split-screen-plan";
import { toCutWords, toPanelPieces } from "#/modules/viral-formats/model/split-screen-timeline";
import type { SplitScreenPiece } from "#/modules/viral-formats/model/split-screen-timeline";
import { localFileInput } from "#/shared/server/local-media-input.server";
import { runCommand } from "#/shared/server/run-command.server";

const FRAMES_PER_SECOND = "30";
const TIME_DECIMALS = 3;
/** Where the eyes sit inside the bottom panel (REC-01), so the head never touches the seam. */
const EYES_FROM_PANEL_TOP = 500;
// REC-05: a linear 5 % zoom per second, capped at 12 %.
const ZOOM_PER_SECOND = 0.05;
const MAX_ZOOM = 0.12;
// The broadcast loudness the format's music balance assumes (REC-06).
const VOICE_LOUDNESS = "loudnorm=I=-14:TP=-1.5:LRA=11";
const VIDEO_ENCODING = [
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

export interface SplitScreenRenderInput {
    plan: SplitScreenPlan;
    words: ReadonlyArray<TranscriptWord>;
    /** Local copies ffmpeg can read: the raw video and each example by its video id. */
    rawVideoPath: string;
    examplePaths: ReadonlyMap<string, string>;
    workDirectory: string;
    signal: AbortSignal;
}

type ExamplePiece = Extract<SplitScreenPiece, { kind: "example" }>;

function toSeconds(value: number): string {
    return value.toFixed(TIME_DECIMALS);
}

async function runFfmpeg(args: Array<string>, input: SplitScreenRenderInput): Promise<void> {
    await runCommand("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
        workingDirectory: input.workDirectory,
        signal: input.signal,
    });
}

/** The kept takes, one after the other, as a 1080x1920 video with an even voice level. */
async function cutPresenter(input: SplitScreenRenderInput): Promise<string> {
    const takes = input.plan.takes;
    const trims = takes.map(
        (take, index) =>
            `[0:v]trim=start=${toSeconds(take.start)}:end=${toSeconds(take.end)},setpts=PTS-STARTPTS[v${index}];` +
            `[0:a]atrim=start=${toSeconds(take.start)}:end=${toSeconds(take.end)},asetpts=PTS-STARTPTS[a${index}]`,
    );
    const concatInputs = takes.map((_take, index) => `[v${index}][a${index}]`).join("");
    const filter = [
        ...trims,
        `${concatInputs}concat=n=${takes.length}:v=1:a=1[cv][ca]`,
        `[cv]crop=w='min(iw,ih*9/16)':h='min(ih,iw*16/9)',scale=${FRAME_WIDTH}:${FRAME_HEIGHT},fps=${FRAMES_PER_SECOND},setsar=1[v]`,
        `[ca]${VOICE_LOUDNESS}[a]`,
    ].join(";");
    const outputPath = "presenter.mp4";
    await runFfmpeg(
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
            outputPath,
        ],
        input,
    );

    return outputPath;
}

/** How far down the presenter's frame the bottom panel starts, so the eyes land where they should. */
function toBottomPanelTop(eyeLine: number): number {
    const top = Math.round(eyeLine * FRAME_HEIGHT - EYES_FROM_PANEL_TOP);
    const evenTop = top - (top % 2);

    return Math.min(Math.max(evenTop, 0), FRAME_HEIGHT - BOTTOM_PANEL_HEIGHT);
}

/** The example on top, cropped to fill the panel, over the presenter below; no sound. */
function buildSplitArgs(
    piece: ExamplePiece,
    examplePath: string,
    input: SplitScreenRenderInput,
): Array<string> {
    const duration = toSeconds(piece.end - piece.start);
    const sourceStart = piece.sourceStart;
    const filter = [
        `[1:v]scale=${FRAME_WIDTH}:${TOP_PANEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${FRAME_WIDTH}:${TOP_PANEL_HEIGHT},fps=${FRAMES_PER_SECOND},setsar=1[top]`,
        `[0:v]crop=${FRAME_WIDTH}:${BOTTOM_PANEL_HEIGHT}:0:${toBottomPanelTop(input.plan.eyeLine)},setsar=1[bottom]`,
        "[top][bottom]vstack=inputs=2[v]",
    ].join(";");

    return [
        "-ss",
        toSeconds(piece.start),
        "-t",
        duration,
        ...localFileInput("presenter.mp4"),
        // A short example loops rather than leaving the panel empty.
        "-stream_loop",
        "-1",
        "-ss",
        toSeconds(sourceStart),
        ...localFileInput(examplePath),
        "-filter_complex",
        filter,
        "-map",
        "[v]",
        "-t",
        duration,
        "-an",
        ...VIDEO_ENCODING,
    ];
}

/** The presenter alone, filling the frame, zooming in slowly (REC-05). */
function buildFullscreenArgs(piece: SplitScreenPiece): Array<string> {
    const duration = toSeconds(piece.end - piece.start);
    const scale = `(1+min(${MAX_ZOOM},${ZOOM_PER_SECOND}*t))`;
    const filter = `[0:v]scale=w='trunc(${FRAME_WIDTH}*${scale}/2)*2':h='trunc(${FRAME_HEIGHT}*${scale}/2)*2':eval=frame,crop=${FRAME_WIDTH}:${FRAME_HEIGHT},setsar=1[v]`;

    return [
        "-ss",
        toSeconds(piece.start),
        "-t",
        duration,
        ...localFileInput("presenter.mp4"),
        "-filter_complex",
        filter,
        "-map",
        "[v]",
        "-an",
        ...VIDEO_ENCODING,
    ];
}

function buildPieceArgs(piece: SplitScreenPiece, input: SplitScreenRenderInput): Array<string> {
    if (piece.kind === "fullscreen") {
        return buildFullscreenArgs(piece);
    }

    const examplePath = input.examplePaths.get(piece.sourceVideoId);

    if (examplePath === undefined) {
        throw new Error(`The example video ${piece.sourceVideoId} was not prepared for the render`);
    }

    return buildSplitArgs(piece, examplePath, input);
}

/** Each stretch rendered on its own, then joined without re-encoding (they share one encoding). */
async function renderPieces(
    input: SplitScreenRenderInput,
    pieces: Array<SplitScreenPiece>,
): Promise<string> {
    const pieceNames: Array<string> = [];

    for (const [index, piece] of pieces.entries()) {
        const pieceName = `piece-${index}.mp4`;
        await runFfmpeg([...buildPieceArgs(piece, input), pieceName], input);
        pieceNames.push(pieceName);
    }

    const listName = "pieces.txt";
    await writeFile(
        path.join(input.workDirectory, listName),
        pieceNames.map((name) => `file '${name}'`).join("\n"),
    );
    const joinedName = "joined.mp4";
    await runFfmpeg(
        ["-f", "concat", "-safe", "0", "-i", listName, "-c", "copy", joinedName],
        input,
    );

    return joinedName;
}

/**
 * Renders a Tela dividida edit into `output.mp4` in the work folder: the kept takes, the example
 * or full-screen presenter above the seam, one-word captions on it and the presenter's voice.
 */
export async function renderSplitScreen(input: SplitScreenRenderInput): Promise<string> {
    const plan = input.plan;
    const pieces = toPanelPieces(plan.panels, plan.takes);
    const presenterName = await cutPresenter(input);
    const joinedName = await renderPieces(input, pieces);
    const captionsName = "captions.ass";
    await writeFile(
        path.join(input.workDirectory, captionsName),
        buildWordCaptions(toCutWords(plan.takes, input.words), pieces),
    );
    const outputName = "output.mp4";
    await runFfmpeg(
        [
            "-i",
            joinedName,
            "-i",
            presenterName,
            "-filter_complex",
            `[0:v]ass=${captionsName}[v]`,
            "-map",
            "[v]",
            "-map",
            "1:a",
            ...VIDEO_ENCODING,
            "-c:a",
            "copy",
            "-shortest",
            "-movflags",
            "+faststart",
            outputName,
        ],
        input,
    );

    return path.join(input.workDirectory, outputName);
}
