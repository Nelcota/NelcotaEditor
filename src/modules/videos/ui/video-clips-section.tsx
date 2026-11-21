import { isVideoFinished } from "#/modules/video-records/video-status";
import type { VideoDetails } from "#/modules/videos/video-views";
import type { ClipView } from "#/modules/clips/clip-view";
import { ClipChips } from "#/modules/videos/ui/clip-chips";
import { ClipPreview } from "#/modules/videos/ui/clip-preview";
import {
    countClipTotal,
    countPlaceholders,
    rankClips,
    rankOfClip,
} from "#/modules/videos/ui/clip-ranking";
import { OriginalPlayer } from "#/modules/videos/ui/original-player";
import { SelectedClipPanel } from "#/modules/videos/ui/selected-clip-panel";
import { TranscriptSection } from "#/modules/videos/ui/transcript-section";
import { useClipStudio } from "#/modules/videos/ui/use-clip-studio";

export const CLIPS_SECTION_ID = "cortes";

function ignoreClipSelection(): void {
    // No clips exist yet, so there is nothing to pick.
}

/** Before Brilho picks the moments there is nothing to show but one waiting slot per clip asked. */
function WaitingClips({ details }: { details: VideoDetails }) {
    const placeholderCount = countPlaceholders(details);

    if (placeholderCount === 0) {
        return null;
    }

    return (
        <section aria-label="Cortes a caminho" className="grid gap-3">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Cortes a caminho
            </p>
            <ClipChips
                clips={[]}
                selectedClipId={null}
                onSelectClip={ignoreClipSelection}
                placeholderCount={placeholderCount}
            />
        </section>
    );
}

/** The clip being watched, large, beside the original; phones see it in the panel below instead. */
function SidePreview({ clip }: { clip: ClipView }) {
    return (
        <div className="hidden gap-2 lg:grid">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Vira este corte
            </p>
            <ClipPreview key={clip.id} clip={clip} />
        </div>
    );
}

/**
 * The studio: the original plays on top, its progress bar marks where every clip comes from, and
 * the clip picked (with the player arrows, the numbered buttons, or by playing into it) shows
 * beside it.
 */
export function VideoClipsSection({ details }: { details: VideoDetails }) {
    const video = details.video;
    const rankedClips = rankClips(details.clips);
    const studio = useClipStudio(rankedClips);
    const selectedClip = studio.selectedClip;

    if (selectedClip === undefined) {
        return <WaitingClips details={details} />;
    }

    const rankOf = (clipId: string): number => rankOfClip(rankedClips, clipId);

    return (
        <section
            id={CLIPS_SECTION_ID}
            aria-label="Estúdio: vídeo original e cortes"
            className="grid scroll-mt-6 gap-4"
        >
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_224px] lg:gap-5">
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
                <SidePreview clip={selectedClip} />
            </div>
            <div className="grid gap-2">
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Escolha um corte · melhores primeiro
                </p>
                <ClipChips
                    clips={rankedClips}
                    selectedClipId={selectedClip.id}
                    onSelectClip={studio.selectClip}
                    placeholderCount={countPlaceholders(details)}
                />
            </div>
            <SelectedClipPanel
                videoId={video.id}
                clip={selectedClip}
                rank={rankOf(selectedClip.id)}
                total={countClipTotal(details)}
                canRetry={isVideoFinished(video.status)}
            />
            <TranscriptSection
                videoId={video.id}
                currentSeconds={studio.currentSeconds}
                onSeek={studio.seek}
            />
        </section>
    );
}
