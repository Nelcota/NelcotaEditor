import { useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import {
    FullscreenButton,
    MuteButton,
    PlayToggleButton,
} from "#/shared/ui/media-player/media-control-buttons";
import { TimeLabel } from "#/shared/ui/media-player/media-readouts";
import { MediaSurface } from "#/shared/ui/media-player/media-surface";
import { SeekBar } from "#/shared/ui/media-player/seek-bar";
import { useMediaPlayer } from "#/shared/ui/media-player/use-media-player";
import { useHasBeenNearViewport } from "#/shared/ui/use-has-been-near-viewport";

// Every content frame (thumbnails, the original, clips) gets the same 1px inset outline.
export const CLIP_FRAME_CLASS =
    "aspect-[9/16] w-full overflow-hidden rounded-md bg-secondary outline-1 [&:fullscreen]:bg-black -outline-offset-1 outline-solid outline-black/10 dark:outline-white/10";

interface VerticalClipPlayerProps {
    /** The player's accessible name. */
    label: string;
    fileUrl: string;
}

/**
 * The clip at its real vertical shape with the same controls as the original, smaller. In narrow
 * spots (the phone list) only the play button and a thin bar fit, and that is all it shows.
 */
export function VerticalClipPlayer({ label, fileUrl }: VerticalClipPlayerProps): ReactNode {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const player = useMediaPlayer(videoRef, containerRef);
    const media = player.media;
    // The clip list can hold hundreds of clips; each source is a request, so only near ones load.
    const isNearViewport = useHasBeenNearViewport(containerRef);
    let source: string | undefined = undefined;

    if (isNearViewport === true) {
        // The media fragment makes the browser show an early frame as the cover.
        source = `${fileUrl}#t=0.1`;
    }

    return (
        <MediaSurface
            player={player}
            containerRef={containerRef}
            label={label}
            size="sm"
            className={CLIP_FRAME_CLASS}
            controls={
                <div className="grid gap-0.5 px-2 pb-1.5">
                    <SeekBar
                        size="sm"
                        label="Posição no corte"
                        currentSeconds={media.currentSeconds}
                        durationSeconds={media.durationSeconds}
                        bufferedSeconds={media.bufferedSeconds}
                        onSeek={player.seekTo}
                    />
                    <div className="hidden items-center @[11rem]:flex">
                        <PlayToggleButton player={player} size="sm" />
                        <TimeLabel
                            currentSeconds={media.currentSeconds}
                            durationSeconds={media.durationSeconds}
                            className="px-1 text-xs"
                        />
                        <span className="flex-1" />
                        <MuteButton player={player} size="sm" />
                        <FullscreenButton player={player} size="sm" />
                    </div>
                </div>
            }
        >
            <video
                disablePictureInPicture
                disableRemotePlayback
                ref={videoRef}
                src={source}
                playsInline
                preload="metadata"
                className={cn("object-cover", player.isFullscreen === true && "object-contain")}
            />
        </MediaSurface>
    );
}
