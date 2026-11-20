import PauseBoldIcon from "~icons/solar/pause-bold";
import PlayBoldIcon from "~icons/solar/play-bold";
import VideocameraRecordIcon from "~icons/solar/videocamera-record-linear";
import { useState } from "react";
import type { ReactNode, RefObject } from "react";
import type { AspectRatio } from "#/modules/clips/clip-format";
import type { StudioDraft } from "#/modules/clips/clip-studio.schema";
import { CaptionOverlay } from "#/modules/videos/ui/studio/caption-overlay";
import type { StudioPlayback } from "#/modules/videos/ui/studio/use-studio-playback";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";

const FRAME_CLASSES: Record<AspectRatio, string> = {
    vertical: "aspect-[9/16] w-full max-w-[300px]",
    square: "aspect-square w-full max-w-[380px]",
    horizontal: "aspect-video w-full max-w-[520px]",
};

interface StudioPreviewProps {
    draft: StudioDraft;
    videoRef: RefObject<HTMLVideoElement | null>;
    playback: StudioPlayback;
    /** Null until the original is on disk. */
    sourceUrl: string | null;
    /** Covers the picture while Brasa works on this clip. */
    overlay?: ReactNode;
}

function NoPreview({ message }: { message: string }): ReactNode {
    return (
        <div className="absolute inset-0 z-20 grid content-center justify-items-center gap-2 bg-card p-6 text-center">
            <VideocameraRecordIcon className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="font-bold">Sem prévia ao vivo</p>
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

function PreviewControls({ draft, playback }: Pick<StudioPreviewProps, "draft" | "playback">) {
    const lengthSeconds = draft.endSeconds - draft.startSeconds;
    const playedSeconds = Math.max(0, playback.currentSeconds - draft.startSeconds);
    let label = "Tocar";
    let Icon = PlayBoldIcon;

    if (playback.isPlaying === true) {
        label = "Pausar";
        Icon = PauseBoldIcon;
    }

    return (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-linear-to-t from-black/75 to-transparent px-2 pt-8 pb-2 text-white">
            <button
                type="button"
                aria-label={label}
                onClick={async () => {
                    await playback.togglePlay();
                }}
                className="grid size-9 place-items-center rounded-full outline-none transition-colors hover:bg-white/15 focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99]"
            >
                <Icon className="size-5" aria-hidden="true" />
            </button>
            <span className="text-xs font-bold tabular-nums">
                {formatClock(playedSeconds)} / {formatClock(lengthSeconds)}
            </span>
            <input
                type="range"
                aria-label="Posição no corte"
                min={draft.startSeconds}
                max={draft.endSeconds}
                step={0.1}
                value={playback.currentSeconds}
                onChange={(event) => playback.seek(Number(event.target.value))}
                className="h-1 min-w-0 flex-1 cursor-pointer accent-white"
            />
        </div>
    );
}

/** The original cropped to the clip's shape with the caption drawn over it: the clip, live. */
export function StudioPreview(props: StudioPreviewProps): ReactNode {
    const { draft, videoRef, playback, sourceUrl, overlay } = props;
    const [hasPlaybackError, setHasPlaybackError] = useState(false);

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
                    ref={videoRef}
                    src={`${sourceUrl}#t=${draft.startSeconds}`}
                    preload="auto"
                    playsInline
                    onError={() => setHasPlaybackError(true)}
                    onClick={async () => {
                        await playback.togglePlay();
                    }}
                    className="absolute inset-0 size-full cursor-pointer object-cover"
                />
            )}
            <CaptionOverlay draft={draft} currentSeconds={playback.currentSeconds} />
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
