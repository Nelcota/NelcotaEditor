import type { ReactNode } from "react";
import type { VideoDetails } from "#/modules/videos/model/video-views";
import { rankClips } from "#/modules/videos/model/clip-ranking";
import { OriginalPlayer } from "#/modules/videos/ui/components/original-player";
import { TranscriptSection } from "#/modules/videos/ui/components/transcript-section";
import { useClipStudio } from "#/modules/videos/ui/hooks/use-clip-studio";

/**
 * The Original tab: the full video with every clip marked on its bar, and the transcript under it.
 * They share one position, so a tap on a line takes the player there. Until the first clip exists
 * the bar has nothing to mark, but the original still plays.
 */
export function VideoOriginalSection({ details }: { details: VideoDetails }): ReactNode {
    const video = details.video;
    const rankedClips = rankClips(details.clips);
    const studio = useClipStudio(rankedClips);

    return (
        <section aria-label="Vídeo original" className="grid max-w-5xl gap-6">
            <OriginalPlayer
                video={video}
                playerRef={studio.playerRef}
                onTimeChange={studio.followPlayback}
                studio={{
                    rankedClips,
                    selectedClip: studio.selectedClip ?? null,
                    onSelectClip: studio.selectClip,
                    onSeek: studio.seek,
                }}
            />
            <TranscriptSection
                videoId={video.id}
                currentSeconds={studio.currentSeconds}
                onSeek={studio.seek}
                isInitiallyOpen
            />
        </section>
    );
}
