import PauseIcon from "~icons/lucide-solid/pause";
import PlayIcon from "~icons/lucide-solid/play";
import VideoIcon from "~icons/lucide/video";
import { useEffect, useState } from "react";
import type { ReactNode, RefObject } from "react";
import type { AspectRatio } from "#/modules/clips/model/clip-format";
import type { StudioDraft } from "#/modules/clips/model/clip-studio";
import { CaptionOverlay } from "#/modules/studio/ui/components/caption-overlay";
import { usePlaybackValue } from "#/modules/studio/ui/hooks/playback-clock";
import type { StudioPlayback } from "#/modules/studio/ui/hooks/use-studio-playback";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";

const TENTHS_PER_SECOND = 10;

// The largest frame of the clip's shape that fits the stage, which is a size container: the
// width is the smaller of the stage's width and what its height allows at that shape.
const FRAME_CLASSES: Record<AspectRatio, string> = {
    vertical: "aspect-[9/16] w-[min(100cqw,calc(100cqh*9/16))]",
    square: "aspect-square w-[min(100cqw,100cqh)]",
    horizontal: "aspect-video w-[min(100cqw,calc(100cqh*16/9))]",
};

interface StudioPreviewProps {
    draft: StudioDraft;
    videoRef: RefObject<HTMLVideoElement | null>;
    playback: StudioPlayback;
    /** Null until the original is on disk. */
    sourceUrl: string | null;
    /** The original's transcript as closed captions; the overlay shows the clip's own captions. */
    captionsUrl: string;
    /** Covers the picture while Brasa works on this clip. */
    overlay?: ReactNode;
}

function NoPreview({ message }: { message: string }): ReactNode {
    return (
        <div className="absolute inset-0 z-20 grid content-center justify-items-center gap-2 bg-card p-6 text-center">
            <VideoIcon className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="font-semibold">Sem prévia ao vivo</p>
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

function PreviewControls({ draft, playback }: Pick<StudioPreviewProps, "draft" | "playback">) {
    const lengthSeconds = draft.endSeconds - draft.startSeconds;
    // The slider steps by a tenth, so the controls re-render ten times a second, not every frame.
    const currentTenths = usePlaybackValue(playback.clock, (seconds) =>
        Math.round(seconds * TENTHS_PER_SECOND),
    );
    const currentSeconds = currentTenths / TENTHS_PER_SECOND;
    const playedSeconds = Math.max(0, currentSeconds - draft.startSeconds);
    let label = "Tocar";
    let Icon = PlayIcon;

    if (playback.isPlaying === true) {
        label = "Pausar";
        Icon = PauseIcon;
    }

    return (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-black/60 p-2 text-white">
            <button
                type="button"
                aria-label={label}
                onClick={playback.togglePlay}
                className="grid size-9 pointer-coarse:size-11 place-items-center rounded-full outline-none transition-colors hover:bg-white/15 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
            >
                <Icon className="size-5" aria-hidden="true" />
            </button>
            <span className="text-xs font-semibold tabular-nums">
                {formatClock(playedSeconds)} / {formatClock(lengthSeconds)}
            </span>
            <input
                type="range"
                aria-label="Posição no corte"
                min={draft.startSeconds}
                max={draft.endSeconds}
                step={1 / TENTHS_PER_SECOND}
                value={currentSeconds}
                onChange={(event) => playback.seek(Number(event.target.value))}
                className="range-media min-w-0 flex-1 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring"
            />
        </div>
    );
}

/** The original cropped to the clip's shape with the caption drawn over it: the clip, live. */
export function StudioPreview(props: StudioPreviewProps): ReactNode {
    const { draft, videoRef, playback, sourceUrl, captionsUrl, overlay } = props;
    const [hasPlaybackError, setHasPlaybackError] = useState(false);
    // Only the first start goes in the media fragment: a changing src reloads the whole video
    // (new requests, a black flash, lost position) on every trim. Later trims seek instead.
    const [firstStartSeconds] = useState(draft.startSeconds);
    const startSeconds = draft.startSeconds;
    const endSeconds = draft.endSeconds;

    useEffect(() => {
        const video = videoRef.current;

        if (video === null || video.paused === false) {
            return;
        }

        if (video.currentTime < startSeconds || video.currentTime > endSeconds) {
            video.currentTime = startSeconds;
        }
    }, [videoRef, startSeconds, endSeconds]);

    return (
        <div
            className={cn(
                "relative isolate overflow-hidden rounded-2xl border bg-black",
                FRAME_CLASSES[draft.aspectRatio],
            )}
            style={{ containerType: "size" }}
        >
            {sourceUrl !== null && (
                <video
                    disablePictureInPicture
                    disableRemotePlayback
                    ref={videoRef}
                    src={`${sourceUrl}#t=${firstStartSeconds}`}
                    preload="auto"
                    playsInline
                    onError={() => setHasPlaybackError(true)}
                    onClick={playback.togglePlay}
                    className="absolute inset-0 size-full cursor-pointer object-cover"
                >
                    <track kind="captions" src={captionsUrl} label="Legendas da transcrição" />
                </video>
            )}
            <CaptionOverlay draft={draft} clock={playback.clock} />
            {sourceUrl === null && (
                <NoPreview message="O vídeo original ainda não está disponível. Você pode editar; o resultado aparece depois de renderizar." />
            )}
            {hasPlaybackError === true && (
                <NoPreview message="Este navegador não toca o formato do vídeo original. Você pode editar normalmente; o resultado aparece depois de renderizar." />
            )}
            <PreviewControls draft={draft} playback={playback} />
            {overlay}
        </div>
    );
}
