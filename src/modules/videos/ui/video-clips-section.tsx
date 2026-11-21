import { useState } from "react";
import type { ReactNode } from "react";
import { isVideoFinished } from "#/modules/video-records/video-status";
import type { VideoDetails } from "#/modules/videos/video-views";
import { ClipList } from "#/modules/videos/ui/clip-list";
import { ClipPreview } from "#/modules/videos/ui/clip-preview";
import { countPlaceholders, rankClips } from "#/modules/videos/ui/clip-ranking";

export const CLIPS_SECTION_ID = "cortes";

function ignoreClipSelection(): void {
    // No clips exist yet, so there is nothing to pick.
}

/**
 * The Cortes tab: the clip picked plays at its real 9:16 shape on the leading side (260px once the
 * column is 42rem wide, 320px from 56rem; sticky while the list scrolls), the list on the rest. The
 * column's own width decides, since the inspector and sidebar take theirs. Narrower, they stack.
 */
export function VideoClipsSection({ details }: { details: VideoDetails }): ReactNode {
    const video = details.video;
    const rankedClips = rankClips(details.clips);
    const [chosenClipId, setChosenClipId] = useState<string | null>(null);
    const selectedClip = rankedClips.find((clip) => clip.id === chosenClipId) ?? rankedClips[0];
    const placeholderCount = countPlaceholders(details);

    if (selectedClip === undefined) {
        if (placeholderCount === 0) {
            return null;
        }

        return (
            <section aria-label="Cortes a caminho" className="max-w-2xl">
                <ClipList
                    videoId={video.id}
                    clips={[]}
                    selectedClipId={null}
                    onSelectClip={ignoreClipSelection}
                    placeholderCount={placeholderCount}
                    canRetry={false}
                />
            </section>
        );
    }

    return (
        <section
            id={CLIPS_SECTION_ID}
            aria-label="Cortes deste vídeo"
            className="@container scroll-mt-6"
        >
            <div className="grid items-start gap-6 @2xl:grid-cols-[260px_minmax(0,1fr)] @2xl:gap-8 @4xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="mx-auto w-full max-w-[220px] @2xl:sticky @2xl:top-0 @2xl:mx-0 @2xl:max-w-none">
                    <ClipPreview key={selectedClip.id} clip={selectedClip} />
                </div>
                <ClipList
                    videoId={video.id}
                    clips={rankedClips}
                    selectedClipId={selectedClip.id}
                    onSelectClip={(clip) => setChosenClipId(clip.id)}
                    placeholderCount={placeholderCount}
                    canRetry={isVideoFinished(video.status)}
                />
            </div>
        </section>
    );
}
