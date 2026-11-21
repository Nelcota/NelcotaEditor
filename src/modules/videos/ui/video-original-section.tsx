import type { ReactNode } from "react";
import type { VideoDetails } from "#/modules/videos/video-views";
import { rankClips } from "#/modules/videos/ui/clip-ranking";
import { OriginalPlayer } from "#/modules/videos/ui/original-player";
import { TranscriptSection } from "#/modules/videos/ui/transcript-section";
import { useClipStudio } from "#/modules/videos/ui/use-clip-studio";

/**
 * The Original tab: the full video with every clip marked on its bar, and the transcript under it.
 * They share one position, so a tap on a line takes the player there. Until the first clip exists
 * the bar has nothing to mark, and only the transcript is shown.
 */
export function VideoOriginalSection({ details }: { details: VideoDetails }): ReactNode {
    const video = details.video;
    const rankedClips = rankClips(details.clips);
    const studio = useClipStudio(rankedClips);
    const selectedClip = studio.selectedClip;

    return (
        <section aria-label="Vídeo original" className="grid max-w-5xl gap-6">
            {selectedClip !== undefined && (
                <OriginalPlayer
                    video={video}
                    playerRef={studio.playerRef}
                    onTimeChange={studio.followPlayback}
                    studio={{
                        rankedClips,
                        selectedClip,
                        onSelectClip: studio.selectClip,
                        onSeek: studio.seek,
                    }}
                />
            )}
            <TranscriptSection
                videoId={video.id}
                currentSeconds={studio.currentSeconds}
                onSeek={studio.seek}
                isInitiallyOpen
            />
        </section>
    );
}
