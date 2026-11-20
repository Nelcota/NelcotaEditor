import { useEffect, useState } from "react";
import type { RefObject } from "react";

interface Fullscreen {
    isFullscreen: boolean;
    toggleFullscreen: () => Promise<void>;
}

/** iPhones only let the video itself go full screen, through a WebKit-only method. */
function enterNativeFullscreen(video: HTMLVideoElement | null): void {
    if (video === null) {
        return;
    }

    if ("webkitEnterFullscreen" in video && typeof video.webkitEnterFullscreen === "function") {
        video.webkitEnterFullscreen();
    }
}

/** Full screen for the whole player, so the custom controls come along. */
export function useFullscreen(
    containerRef: RefObject<HTMLDivElement | null>,
    videoRef: RefObject<HTMLVideoElement | null>,
): Fullscreen {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const followDocument = (): void => {
            setIsFullscreen(document.fullscreenElement === containerRef.current);
        };

        document.addEventListener("fullscreenchange", followDocument);
        return () => document.removeEventListener("fullscreenchange", followDocument);
    }, [containerRef]);

    const toggleFullscreen = async (): Promise<void> => {
        const container = containerRef.current;

        if (document.fullscreenElement !== null) {
            await document.exitFullscreen();
            return;
        }

        if (container === null) {
            return;
        }

        if (document.fullscreenEnabled === false) {
            enterNativeFullscreen(videoRef.current);
            return;
        }

        await container.requestFullscreen();
    };

    return { isFullscreen, toggleFullscreen };
}
