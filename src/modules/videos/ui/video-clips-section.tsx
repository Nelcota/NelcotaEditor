import { isVideoFinished } from "#/modules/video-records/video-status";
import type { VideoDetails } from "#/modules/videos/video-views";
import { ClipChips } from "#/modules/videos/ui/clip-chips";
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

function ClipsPanelHeading({ count }: { count: number }) {
    return (
        <h2 className="flex h-14 items-center gap-2 border-b px-4 font-semibold sm:px-5">
            Cortes
            <span className="font-mono text-xs font-medium text-muted-foreground tabular-nums">
                {count}
            </span>
        </h2>
    );
}

/** Before Brilho picks the moments there is nothing to show but one waiting slot per clip asked. */
function WaitingClips({ details }: { details: VideoDetails }) {
    const placeholderCount = countPlaceholders(details);

    if (placeholderCount === 0) {
        return null;
    }

    return (
        <section aria-label="Cortes a caminho" className="rounded-2xl border bg-card">
            <ClipsPanelHeading count={placeholderCount} />
            <div className="p-2 sm:p-3">
                <ClipChips
                    clips={[]}
                    selectedClipId={null}
                    onSelectClip={ignoreClipSelection}
                    placeholderCount={placeholderCount}
                />
            </div>
        </section>
    );
}

/**
 * Twelve columns from lg: the original and its transcript take eight, the clips panel four (the
 * list, then the clip picked playing at its real shape with its actions). The original's progress
 * bar marks where every clip comes from. Narrower, the panel follows the player.
 */
export function VideoClipsSection({ details }: { details: VideoDetails }) {
    const video = details.video;
    const rankedClips = rankClips(details.clips);
    const studio = useClipStudio(rankedClips);
    const selectedClip = studio.selectedClip;

    if (selectedClip === undefined) {
        return <WaitingClips details={details} />;
    }

    return (
        <section
            id={CLIPS_SECTION_ID}
            aria-label="Vídeo original e cortes"
            className="grid scroll-mt-24 items-start gap-6 lg:grid-cols-12"
        >
            <div className="min-w-0 lg:col-span-8">
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
            </div>
            <aside
                aria-label="Cortes deste vídeo"
                className="rounded-2xl border bg-card lg:sticky lg:top-24 lg:col-span-4 lg:row-span-2"
            >
                <ClipsPanelHeading count={countClipTotal(details)} />
                <div className="p-2 sm:p-3">
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
                    rank={rankOfClip(rankedClips, selectedClip.id)}
                    total={countClipTotal(details)}
                    canRetry={isVideoFinished(video.status)}
                />
            </aside>
            {/* After the clips in the reading order (phones), under the player from lg. */}
            <div className="min-w-0 lg:col-span-8">
                <TranscriptSection
                    videoId={video.id}
                    currentSeconds={studio.currentSeconds}
                    onSeek={studio.seek}
                />
            </div>
        </section>
    );
}
