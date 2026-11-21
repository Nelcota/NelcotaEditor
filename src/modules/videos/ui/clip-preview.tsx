import { useRef } from "react";
import type { ReactNode } from "react";
import type { ClipStatus } from "#/modules/clips/clip-status";
import type { VideoStatus } from "#/modules/videos/video-status";
import type { ClipView } from "#/modules/videos/video-views";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
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

/** A clip that is not ready shows the crew member on its stage. */
const CLIP_STAGE: Record<ClipStatus, VideoStatus> = {
    pending: "queued",
    rendering: "rendering",
    done: "done",
    failed: "failed",
};

const NOT_READY_LABELS: Record<ClipStatus, string> = {
    pending: "Na fila",
    rendering: "Brasa está montando",
    done: "",
    failed: "Não deu para renderizar",
};

const FRAME_CLASS = "aspect-[9/16] w-full overflow-hidden rounded-xl";

/**
 * The clip at its real vertical shape with the same controls as the original, smaller. In narrow
 * spots (the phone list) only the play button and a thin bar fit, and that is all it shows.
 */
function PlayablePreview({ clip, fileUrl }: { clip: ClipView; fileUrl: string }): ReactNode {
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
            label={`Corte: ${clip.title}`}
            size="sm"
            className={FRAME_CLASS}
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

/** The clip itself when ready; otherwise the crew member and what is going on. */
export function ClipPreview({ clip }: { clip: ClipView }): ReactNode {
    const fileUrl = clip.fileUrl;

    if (fileUrl !== null) {
        return <PlayablePreview clip={clip} fileUrl={fileUrl} />;
    }

    return (
        <div
            className={cn(
                FRAME_CLASS,
                "flex flex-col items-center justify-center gap-2 p-3 text-center text-xs font-semibold",
                clip.status === "failed" && "bg-destructive/10 text-destructive",
                clip.status !== "failed" && "bg-muted/60 text-muted-foreground",
            )}
        >
            <StageCrewMascot
                status={CLIP_STAGE[clip.status]}
                isWorking={clip.status === "rendering"}
                className="size-10"
            />
            {NOT_READY_LABELS[clip.status]}
        </div>
    );
}
