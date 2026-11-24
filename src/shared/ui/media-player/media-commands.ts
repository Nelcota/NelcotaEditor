import { reportClientProblem } from "#/shared/errors/report-client-problem";
/** Speeds the speed button steps through, in order; it wraps around after the last one. */
const PLAYBACK_RATES = [1, 1.25, 1.5, 2, 0.5];
const MIN_VOLUME = 0;
const MAX_VOLUME = 1;

async function startPlayback(video: HTMLVideoElement): Promise<void> {
    try {
        await video.play();
    } catch (error) {
        // The browser can refuse to start (autoplay rules) or a pause can interrupt the start; the
        // play button stays visible, so the person can simply press it again.
        reportClientProblem("Could not start the video", error);
    }
}

export async function togglePlayback(video: HTMLVideoElement): Promise<void> {
    if (video.paused === false) {
        video.pause();
        return;
    }

    await startPlayback(video);
}

export function seekTo(video: HTMLVideoElement, seconds: number): void {
    if (Number.isFinite(seconds) === false) {
        return;
    }

    const durationSeconds = video.duration;
    const targetSeconds = Math.max(0, seconds);

    if (Number.isFinite(durationSeconds) === false) {
        video.currentTime = targetSeconds;
        return;
    }

    video.currentTime = Math.min(targetSeconds, durationSeconds);
}

export function seekBy(video: HTMLVideoElement, deltaSeconds: number): void {
    seekTo(video, video.currentTime + deltaSeconds);
}

export function toggleMute(video: HTMLVideoElement): void {
    video.muted = video.muted === false;
}

export function setVolumeLevel(video: HTMLVideoElement, level: number): void {
    if (Number.isFinite(level) === false) {
        return;
    }

    const volume = Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, level));
    video.volume = volume;
    // Dragging the slider up is a clear wish to hear it; dragging it to zero is muting.
    video.muted = volume === MIN_VOLUME;
}

export function stepPlaybackRate(video: HTMLVideoElement): void {
    const currentIndex = PLAYBACK_RATES.indexOf(video.playbackRate);
    const nextRate = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length];

    if (nextRate === undefined) {
        return;
    }

    video.playbackRate = nextRate;
}
