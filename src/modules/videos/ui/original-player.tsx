import Rewind10SecondsBackBoldIcon from "~icons/solar/rewind-10-seconds-back-bold";
import Rewind10SecondsForwardBoldIcon from "~icons/solar/rewind-10-seconds-forward-bold";
import { useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import type { ClipView, VideoSummary } from "#/modules/videos/video-views";
import { findClipAt, rankOfClip } from "#/modules/videos/ui/clip-ranking";
import { ClipMarks } from "#/modules/videos/ui/clip-marks";
import { ClipSwitcher } from "#/modules/videos/ui/clip-switcher";
import { SeekThumbnail } from "#/modules/videos/ui/seek-thumbnail";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { ControlButton } from "#/shared/ui/media-player/control-button";
import {
    FullscreenButton,
    MuteButton,
    PlayToggleButton,
} from "#/shared/ui/media-player/media-control-buttons";
import {
    PlaybackRateButton,
    TimeLabel,
    VolumeSlider,
} from "#/shared/ui/media-player/media-readouts";
import { MediaSurface } from "#/shared/ui/media-player/media-surface";
import { SeekBar } from "#/shared/ui/media-player/seek-bar";
import { useMediaPlayer } from "#/shared/ui/media-player/use-media-player";
import type { MediaPlayer } from "#/shared/ui/media-player/use-media-player";

const FRAME_CLASS = "relative aspect-video w-full overflow-hidden rounded-2xl border bg-black";
const SKIP_SECONDS = 10;

/** The original and its clips, as the studio hands them over. */
interface StudioLink {
    rankedClips: Array<ClipView>;
    selectedClip: ClipView;
    onSelectClip: (clip: ClipView) => void;
    onSeek: (seconds: number) => void;
}

interface OriginalPlayerProps {
    video: VideoSummary;
    playerRef: RefObject<HTMLVideoElement | null>;
    onTimeChange: (seconds: number) => void;
    studio: StudioLink;
}

/** Shown when there is nothing to play yet, or the browser cannot play this file's format. */
function OriginalUnavailable({
    video,
    message,
}: {
    video: VideoSummary;
    message: string;
}): ReactNode {
    const thumbnailUrl = video.thumbnailUrl;

    return (
        <div className={FRAME_CLASS}>
            {thumbnailUrl !== null && (
                <img
                    src={thumbnailUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 size-full object-cover opacity-40"
                />
            )}
            <div className="absolute inset-0 grid content-center justify-items-center gap-2 p-6 text-center text-sm font-semibold text-white">
                {thumbnailUrl === null && <VideoMascot videoId={video.id} className="size-14" />}
                {thumbnailUrl !== null && <StageCrewMascot status="queued" className="size-12" />}
                <p className="max-w-sm">{message}</p>
            </div>
        </div>
    );
}

/** The number of the clip the pointer is over on the bar, if any. */
function rankOfClipAt(rankedClips: Array<ClipView>, seconds: number): number | null {
    const clipThere = findClipAt(rankedClips, seconds);

    if (clipThere === undefined) {
        return null;
    }

    return rankOfClip(rankedClips, clipThere.id);
}

interface OriginalControlsProps {
    player: MediaPlayer;
    fileUrl: string;
    durationSeconds: number;
    studio: StudioLink;
}

/** The seek bar with the clips marked on it, then one row of controls; narrow players drop extras. */
function OriginalControls({
    player,
    fileUrl,
    durationSeconds,
    studio,
}: OriginalControlsProps): ReactNode {
    const media = player.media;
    const rankedClips = studio.rankedClips;
    const selectedClipId = studio.selectedClip.id;

    const renderPreview = (seconds: number): ReactNode => (
        <SeekThumbnail
            fileUrl={fileUrl}
            seconds={seconds}
            clipRank={rankOfClipAt(rankedClips, seconds)}
        />
    );

    return (
        <div className="grid gap-1 px-3 pb-2 @xl:px-4 @xl:pb-3">
            <SeekBar
                label="Posição no vídeo original"
                currentSeconds={media.currentSeconds}
                durationSeconds={durationSeconds}
                bufferedSeconds={media.bufferedSeconds}
                onSeek={studio.onSeek}
                marks={
                    <ClipMarks
                        clips={rankedClips}
                        selectedClipId={selectedClipId}
                        durationSeconds={durationSeconds}
                    />
                }
                renderPreview={renderPreview}
            />
            <div className="flex items-center gap-0.5">
                <PlayToggleButton player={player} />
                <ControlButton
                    label="Voltar 10 s (J)"
                    icon={Rewind10SecondsBackBoldIcon}
                    onClick={() => player.seekBy(-SKIP_SECONDS)}
                    className="hidden @lg:grid"
                />
                <ControlButton
                    label="Avançar 10 s (L)"
                    icon={Rewind10SecondsForwardBoldIcon}
                    onClick={() => player.seekBy(SKIP_SECONDS)}
                    className="hidden @lg:grid"
                />
                <MuteButton player={player} />
                <VolumeSlider player={player} className="mr-1 hidden @2xl:block" />
                <TimeLabel
                    currentSeconds={media.currentSeconds}
                    durationSeconds={durationSeconds}
                />
                <span className="flex-1" />
                <ClipSwitcher
                    rankedClips={rankedClips}
                    selectedClipId={selectedClipId}
                    onSelectClip={studio.onSelectClip}
                />
                <PlaybackRateButton player={player} />
                <FullscreenButton player={player} />
            </div>
        </div>
    );
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
            className="aspect-video w-full rounded-2xl border"
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
                ref={playerRef}
                src={fileUrl}
                poster={video.thumbnailUrl ?? undefined}
                playsInline
                preload="metadata"
                onTimeUpdate={(event) => onTimeChange(event.currentTarget.currentTime)}
                onSeeked={(event) => onTimeChange(event.currentTarget.currentTime)}
                onError={onFailure}
                className="object-contain"
            />
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
                message="O vídeo original aparece aqui assim que o Faísca terminar de trazê-lo."
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
