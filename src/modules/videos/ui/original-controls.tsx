import RotateCcwIcon from "~icons/lucide/rotate-ccw";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import type { ReactNode } from "react";
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
                    icon={RotateCcwIcon}
                    onClick={() => player.seekBy(-SKIP_SECONDS)}
                    className="hidden @lg:grid"
                />
                <ControlButton
                    label="Avançar 10 s (L)"
                    icon={RotateCwIcon}
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
