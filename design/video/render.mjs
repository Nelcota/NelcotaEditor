/*
 * Renders the presentation film to MP4.
 *   PLAYWRIGHT_MODULE=<path to the playwright package> node design/video/render.mjs <work dir>
 * Set FILM_VERSION=short for the ~37 s cut (default: full).
 * Set MUSIC_FILE=<audio file> to use a real track instead of the synthesized one.
 * Frames are captured with headless Edge, the sound track is synthesized here, and FFmpeg from the
 * worker image (already built by `npm run services:up`) encodes the result.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSoundTrack } from "./sound-track.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUT_NAMES = {
    full: "nelcota-apresentacao.mp4",
    short: "nelcota-apresentacao-curto.mp4",
};

function readVersion() {
    const version = process.env.FILM_VERSION;

    if (version === undefined || version.trim().length === 0) {
        return "full";
    }

    if (OUTPUT_NAMES[version] === undefined) {
        throw new Error(`FILM_VERSION must be "full" or "short", got "${version}".`);
    }

    return version;
}

const VERSION = readVersion();
const OUTPUT_NAME = OUTPUT_NAMES[VERSION];
const JPEG_QUALITY = 92;

function readWorkDirectory() {
    const workDirectory = process.argv[2];

    if (workDirectory === undefined || workDirectory.trim().length === 0) {
        throw new Error("Pass a work directory for the frames: node render.mjs <work dir>");
    }

    return resolve(workDirectory);
}

function loadPlaywright() {
    const require = createRequire(import.meta.url);
    const modulePath = process.env.PLAYWRIGHT_MODULE;

    if (modulePath === undefined || modulePath.trim().length === 0) {
        return require("playwright");
    }

    return require(modulePath);
}

async function captureFrames(framesDirectory) {
    const { chromium } = loadPlaywright();
    const browser = await chromium.launch({ channel: "msedge" });
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    await page.goto(`${pathToFileURL(join(HERE, "index.html")).href}?version=${VERSION}&t=0`);
    await page.evaluate(async () => {
        await document.fonts.ready;
    });
    await page.waitForLoadState("networkidle");
    const size = await page.evaluate(() => ({
        width: window.film.width,
        height: window.film.height,
    }));
    await page.setViewportSize(size);
    const film = await page.evaluate(() => ({
        duration: window.film.duration,
        fps: window.film.fps,
        sounds: window.film.sounds,
    }));
    const frameCount = Math.round(film.duration * film.fps);

    for (let frame = 0; frame < frameCount; frame += 1) {
        await page.evaluate((time) => window.film.seek(time), frame / film.fps);
        const name = `${String(frame).padStart(5, "0")}.jpg`;
        await page.screenshot({
            path: join(framesDirectory, name),
            type: "jpeg",
            quality: JPEG_QUALITY,
        });
    }

    await browser.close();

    return film;
}

const MUSIC_VOLUME = 0.35;
const MUSIC_FADE_SECONDS = 2.5;

/* Without a music file the synthesized track is used; with one, it plays under the effects. */
function readMusicFile() {
    const musicFile = process.env.MUSIC_FILE;

    if (musicFile === undefined || musicFile.trim().length === 0) {
        return null;
    }

    return resolve(musicFile);
}

function buildAudioArguments(hasMusic, duration) {
    if (hasMusic === false) {
        return { inputs: [], mapping: ["-map", "0:v", "-map", "1:a"] };
    }

    const fadeStart = Math.max(0, duration - MUSIC_FADE_SECONDS).toFixed(2);
    const filter = `[2:a]volume=${MUSIC_VOLUME},afade=t=in:d=1,afade=t=out:st=${fadeStart}:d=${MUSIC_FADE_SECONDS}[music];[1:a][music]amix=inputs=2:duration=first:normalize=0[audio]`;

    return {
        inputs: ["-stream_loop", "-1", "-i", "/work/music"],
        mapping: ["-filter_complex", filter, "-map", "0:v", "-map", "[audio]"],
    };
}

function encode(workDirectory, audio) {
    const result = spawnSync(
        "docker",
        [
            "run",
            "--rm",
            "-v",
            `${workDirectory}:/work`,
            "--entrypoint",
            "ffmpeg",
            "nelcota-worker",
            "-y",
            "-loglevel",
            "error",
            "-framerate",
            "30",
            "-i",
            "/work/frames/%05d.jpg",
            "-i",
            "/work/sound.wav",
            ...audio.inputs,
            ...audio.mapping,
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            "-movflags",
            "+faststart",
            `/work/${OUTPUT_NAME}`,
        ],
        { stdio: "inherit" },
    );

    if (result.status !== 0) {
        throw new Error(`FFmpeg exited with status ${result.status}.`);
    }
}

const workDirectory = readWorkDirectory();
const framesDirectory = join(workDirectory, "frames");
rmSync(framesDirectory, { recursive: true, force: true });
mkdirSync(framesDirectory, { recursive: true });
const film = await captureFrames(framesDirectory);
const musicFile = readMusicFile();
const hasMusic = musicFile !== null;

if (hasMusic) {
    copyFileSync(musicFile, join(workDirectory, "music"));
}

writeFileSync(
    join(workDirectory, "sound.wav"),
    buildSoundTrack(film.duration, film.sounds, { includeMusic: hasMusic === false }),
);
encode(workDirectory, buildAudioArguments(hasMusic, film.duration));
copyFileSync(join(workDirectory, OUTPUT_NAME), join(HERE, OUTPUT_NAME));
console.info(`Rendered ${OUTPUT_NAME} (${film.duration.toFixed(1)} s).`);
