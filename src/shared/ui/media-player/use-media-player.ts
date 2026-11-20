import type { KeyboardEvent, RefObject } from "react";
import {
    seekBy,
    seekTo,
    setVolumeLevel,
    stepPlaybackRate,
    toggleMute,
    togglePlayback,
} from "#/shared/ui/media-player/media-commands";
import { handleMediaShortcut } from "#/shared/ui/media-player/media-shortcuts";
import type { MediaState } from "#/shared/ui/media-player/media-state";
import { useFullscreen } from "#/shared/ui/media-player/use-fullscreen";
import { useIdle } from "#/shared/ui/media-player/use-idle";
import { useMediaState } from "#/shared/ui/media-player/use-media-state";

export interface MediaPlayer {
    media: MediaState;
    isIdle: boolean;
    isFullscreen: boolean;
    wake: () => void;
    togglePlay: () => Promise<void>;
    seekTo: (seconds: number) => void;
    seekBy: (deltaSeconds: number) => void;
    toggleMute: () => void;
    setVolume: (level: number) => void;
    stepRate: () => void;
    toggleFullscreen: () => Promise<void>;
    handleKeyDown: (event: KeyboardEvent<HTMLElement>) => Promise<void>;
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

    const withVideo =
        <Args extends Array<unknown>>(command: (video: HTMLVideoElement, ...args: Args) => void) =>
        (...args: Args): void => {
            const video = videoRef.current;

            if (video === null) {
                return;
            }

            command(video, ...args);
        };

    const togglePlay = async (): Promise<void> => {
        const video = videoRef.current;

        if (video === null) {
            return;
        }

        idle.wake();
        await togglePlayback(video);
    };

    const actions = {
        togglePlay,
        seekTo: withVideo(seekTo),
        seekBy: withVideo(seekBy),
        toggleMute: withVideo(toggleMute),
        setVolume: withVideo(setVolumeLevel),
        stepRate: withVideo(stepPlaybackRate),
        toggleFullscreen: fullscreen.toggleFullscreen,
    };

    const handleKeyDown = async (event: KeyboardEvent<HTMLElement>): Promise<void> => {
        idle.wake();
        await handleMediaShortcut(event, actions);
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
