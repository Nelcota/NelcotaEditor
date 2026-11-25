import { useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { toCaptionsUrl } from "#/modules/transcription/model/captions-url";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { OriginalControls } from "#/modules/videos/ui/components/original-controls";
import type { StudioLink } from "#/modules/videos/ui/components/original-controls";
import { OriginalUnavailable } from "#/modules/videos/ui/components/original-unavailable";
import { MediaSurface } from "#/shared/ui/media-player/media-surface";
import { useMediaPlayer } from "#/shared/ui/media-player/use-media-player";

interface OriginalPlayerProps {
    video: VideoSummary;
    playerRef: RefObject<HTMLVideoElement | null>;
    onTimeChange: (seconds: number) => void;
    studio: StudioLink;
}

interface PlayableOriginalProps extends OriginalPlayerProps {
    fileUrl: string;
    onFailure: () => void;
}

function PlayableOriginal({
    video,
    playerRef,
    onTimeChange,
    studio,
    fileUrl,
    onFailure,
}: PlayableOriginalProps): ReactNode {
    const containerRef = useRef<HTMLDivElement>(null);
    const player = useMediaPlayer(playerRef, containerRef);
    // The file's own duration is exact; the stored one covers the moment before its metadata loads.
    const durationSeconds = player.media.durationSeconds || (video.durationSeconds ?? 0);

    return (
        <MediaSurface
            player={player}
            containerRef={containerRef}
            label={`Vídeo original: ${video.title}`}
            className="aspect-video w-full rounded-2xl outline-1 -outline-offset-1 outline-solid outline-black/10 dark:outline-white/10"
            controls={
                <OriginalControls
                    player={player}
                    fileUrl={fileUrl}
                    durationSeconds={durationSeconds}
                    studio={studio}
                />
            }
        >
            <video
                disablePictureInPicture
                disableRemotePlayback
                ref={playerRef}
                src={fileUrl}
                poster={video.thumbnailUrl ?? undefined}
                playsInline
                preload="metadata"
                onTimeUpdate={(event) => onTimeChange(event.currentTarget.currentTime)}
                onSeeked={(event) => onTimeChange(event.currentTarget.currentTime)}
                onError={onFailure}
                className="object-contain"
            >
                <track
                    kind="captions"
                    src={toCaptionsUrl(video.id)}
                    label="Legendas da transcrição"
                />
            </video>
        </MediaSurface>
    );
}

/** The whole original video, so each clip can be seen in its context. */
export function OriginalPlayer(props: OriginalPlayerProps): ReactNode {
    const [hasFailed, setHasFailed] = useState(false);
    const video = props.video;
    const originalFileUrl = video.originalFileUrl;

    if (originalFileUrl === null) {
        return (
            <OriginalUnavailable
                video={video}
                message="O vídeo original aparece aqui assim que o download terminar."
            />
        );
    }

    if (hasFailed === true) {
        return (
            <OriginalUnavailable
                video={video}
                message="O navegador não consegue tocar este arquivo. Os cortes continuam prontos para assistir e baixar."
            />
        );
    }

    return (
        <PlayableOriginal
            {...props}
            fileUrl={originalFileUrl}
            onFailure={() => setHasFailed(true)}
        />
    );
}
