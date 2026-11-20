import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { INITIAL_MEDIA_STATE, readMediaState } from "#/shared/ui/media-player/media-state";
import type { MediaState } from "#/shared/ui/media-player/media-state";

const STATE_EVENTS = [
    "play",
    "timeupdate",
    "durationchange",
    "loadedmetadata",
    "progress",
    "volumechange",
    "ratechange",
    "ended",
    "seeked",
];
const WAIT_START_EVENTS = ["waiting"];
const WAIT_END_EVENTS = ["playing", "canplay", "pause", "error"];

/** Mirrors the video element's state into React, so the custom controls can draw it. */
export function useMediaState(videoRef: RefObject<HTMLVideoElement | null>): MediaState {
    const [state, setState] = useState<MediaState>(INITIAL_MEDIA_STATE);

    useEffect(() => {
        const video = videoRef.current;

        if (video === null) {
            return undefined;
        }

        let isWaiting = false;
        const refresh = (): void => setState(readMediaState(video, isWaiting));
        const startWaiting = (): void => {
            isWaiting = true;
            refresh();
        };
        const stopWaiting = (): void => {
            isWaiting = false;
            refresh();
        };

        STATE_EVENTS.forEach((name) => video.addEventListener(name, refresh));
        WAIT_START_EVENTS.forEach((name) => video.addEventListener(name, startWaiting));
        WAIT_END_EVENTS.forEach((name) => video.addEventListener(name, stopWaiting));
        refresh();

        return () => {
            STATE_EVENTS.forEach((name) => video.removeEventListener(name, refresh));
            WAIT_START_EVENTS.forEach((name) => video.removeEventListener(name, startWaiting));
            WAIT_END_EVENTS.forEach((name) => video.removeEventListener(name, stopWaiting));
        };
    }, [videoRef]);

    return state;
}
