import type { RefObject } from "react";
import {
    seekBy,
    seekTo,
    setVolumeLevel,
    stepPlaybackRate,
    toggleMute,
    togglePlayback,
} from "#/shared/ui/media-player/media-commands";
import { handleMediaShortcut } from "#/shared/ui/media-player/media-shortcuts";
import type { ShortcutKeyEvent } from "#/shared/ui/media-player/media-shortcuts";
import type { MediaState } from "#/shared/ui/media-player/media-state";
import { useFullscreen } from "#/shared/ui/media-player/use-fullscreen";
import { useIdle } from "#/shared/ui/media-player/use-idle";
import { useMediaState } from "#/shared/ui/media-player/use-media-state";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

export interface MediaPlayer {
    media: MediaState;
    isIdle: boolean;
    isFullscreen: boolean;
    wake: () => void;
    togglePlay: () => void;
    seekTo: (seconds: number) => void;
    seekBy: (deltaSeconds: number) => void;
    toggleMute: () => void;
    setVolume: (level: number) => void;
    stepRate: () => void;
    toggleFullscreen: () => void;
    handleKeyDown: (event: ShortcutKeyEvent) => void;
}

/**
 * Everything a custom-controlled video needs: its state, its commands and its keyboard keys. The
 * caller owns both refs: the video element and the box that goes full screen around it.
 */
export function useMediaPlayer(
    videoRef: RefObject<HTMLVideoElement | null>,
    containerRef: RefObject<HTMLDivElement | null>,
): MediaPlayer {
    const media = useMediaState(videoRef);
    const idle = useIdle(media.isPlaying);
    const fullscreen = useFullscreen(containerRef, videoRef);
    const track = useTrackPromise();

    const withVideo =
        <Args extends Array<unknown>>(command: (video: HTMLVideoElement, ...args: Args) => void) =>
        (...args: Args): void => {
            const video = videoRef.current;

            if (video === null) {
                return;
            }

            command(video, ...args);
        };

    const togglePlay = (): void => {
        const video = videoRef.current;

        if (video === null) {
            return;
        }

        idle.wake();
        track(togglePlayback(video));
    };

    const actions = {
        togglePlay,
        seekTo: withVideo(seekTo),
        seekBy: withVideo(seekBy),
        toggleMute: withVideo(toggleMute),
        setVolume: withVideo(setVolumeLevel),
        stepRate: withVideo(stepPlaybackRate),
        toggleFullscreen: () => track(fullscreen.toggleFullscreen()),
    };

    const handleKeyDown = (event: ShortcutKeyEvent): void => {
        idle.wake();
        handleMediaShortcut(event, actions);
    };

    return {
        media,
        isIdle: idle.isIdle,
        isFullscreen: fullscreen.isFullscreen,
        wake: idle.wake,
        handleKeyDown,
        ...actions,
    };
}
