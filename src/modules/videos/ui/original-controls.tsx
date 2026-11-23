import type { ReactNode, SVGProps } from "react";
import type { ClipView } from "#/modules/clips/clip-view";
import { findClipAt, rankOfClip } from "#/modules/videos/ui/clip-ranking";
import { ClipMarks } from "#/modules/videos/ui/clip-marks";
import { ClipSwitcher } from "#/modules/videos/ui/clip-switcher";
import { SeekThumbnail } from "#/modules/videos/ui/seek-thumbnail";
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
import { SeekBar } from "#/shared/ui/media-player/seek-bar";
import type { MediaPlayer } from "#/shared/ui/media-player/use-media-player";

const SKIP_SECONDS = 10;

/** The skip arrows carry the "10" inside, so they do not read as the "Tentar de novo" arrow. */
function SkipBackIcon(props: SVGProps<SVGSVGElement>): ReactNode {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" />
            <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
            <SkipSecondsText />
        </svg>
    );
}

function SkipForwardIcon(props: SVGProps<SVGSVGElement>): ReactNode {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" strokeLinecap="round" />
            <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
            <SkipSecondsText />
        </svg>
    );
}

function SkipSecondsText(): ReactNode {
    return (
        <text
            x="12"
            y="15.5"
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontSize="9"
            fontWeight="700"
            fontFamily="inherit"
        >
            {SKIP_SECONDS}
        </text>
    );
}

/** The original and its clips, as the studio hands them over. */
export interface StudioLink {
    rankedClips: Array<ClipView>;
    selectedClip: ClipView;
    onSelectClip: (clip: ClipView) => void;
    onSeek: (seconds: number) => void;
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
export function OriginalControls({
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
                    icon={SkipBackIcon}
                    onClick={() => player.seekBy(-SKIP_SECONDS)}
                    className="hidden @lg:grid"
                />
                <ControlButton
                    label="Avançar 10 s (L)"
                    icon={SkipForwardIcon}
                    onClick={() => player.seekBy(SKIP_SECONDS)}
                    className="hidden @lg:grid"
                />
                <MuteButton player={player} />
                <VolumeSlider player={player} className="me-1 hidden @2xl:block" />
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
