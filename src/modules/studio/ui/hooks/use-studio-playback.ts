import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { createPlaybackClock } from "#/modules/studio/ui/hooks/playback-clock";
import type { PlaybackClock } from "#/modules/studio/ui/hooks/playback-clock";
import { findPlaybackCorrection } from "#/modules/studio/model/playback-correction";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

interface PlaybackRange {
    startSeconds: number;
    endSeconds: number;
}

export interface StudioPlayback {
    /** The time, every frame; read it with usePlaybackValue, or clock.read() inside a handler. */
    clock: PlaybackClock;
    isPlaying: boolean;
    togglePlay: () => void;
    seek: (seconds: number) => void;
}

/**
 * Plays the original only inside the clip's range, like the finished clip would, and reports the
 * time every frame while playing so the captions keep up with the voice.
 */
export function useStudioPlayback(
    videoRef: RefObject<HTMLVideoElement | null>,
    range: PlaybackRange,
): StudioPlayback {
    const rangeRef = useRef(range);
    const [clock] = useState(() => createPlaybackClock(range.startSeconds));
    const [isPlaying, setIsPlaying] = useState(false);
    const track = useTrackPromise();

    useEffect(() => {
        rangeRef.current = range;
    }, [range]);

    const seek = (seconds: number): void => {
        const video = videoRef.current;
        const { startSeconds, endSeconds } = rangeRef.current;
        const clamped = Math.min(Math.max(seconds, startSeconds), endSeconds);
        clock.write(clamped);

        if (video === null) {
            return;
        }

        video.currentTime = clamped;
    };

    const togglePlay = (): void => {
        const video = videoRef.current;

        if (video === null) {
            return;
        }

        if (video.paused === false) {
            video.pause();
            return;
        }

        const clipRange = rangeRef.current;

        if (findPlaybackCorrection(video.currentTime, clipRange) !== "none") {
            video.currentTime = clipRange.startSeconds;
        }

        track(video.play());
    };

    useEffect(() => {
        const video = videoRef.current;

        if (video === null || isPlaying === false) {
            return undefined;
        }

        let frame = 0;
        const follow = (): void => {
            const clipRange = rangeRef.current;
            const correction = findPlaybackCorrection(video.currentTime, clipRange);

            if (correction === "rewindAndPause") {
                video.pause();
            }

            if (correction !== "none") {
                video.currentTime = clipRange.startSeconds;
            }

            clock.write(video.currentTime);
            frame = window.requestAnimationFrame(follow);
        };

        frame = window.requestAnimationFrame(follow);
        return () => window.cancelAnimationFrame(frame);
    }, [isPlaying, videoRef, clock]);

    useEffect(() => {
        const video = videoRef.current;

        if (video === null) {
            return undefined;
        }

        const onPlay = (): void => setIsPlaying(true);
        const onPause = (): void => setIsPlaying(false);
        const onSeeked = (): void => clock.write(video.currentTime);
        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("seeked", onSeeked);

        return () => {
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("seeked", onSeeked);
        };
    }, [videoRef, clock]);

    return { clock, isPlaying, togglePlay, seek };
}
