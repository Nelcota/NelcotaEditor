import { isVideoFinished } from "#/modules/video-records/model/video-status";
import type { VideoDetails } from "#/modules/videos/model/video-views";
import type { ClipView } from "#/modules/clips/model/clip-view";

/** While processing, the requested clips that have no row yet are shown as waiting slots. */
export function countPlaceholders(details: VideoDetails): number {
    const video = details.video;
    const requestedClipCount = video.requestedClipCount;

    if (isVideoFinished(video.status) === true) {
        return 0;
    }

    if (Number.isFinite(requestedClipCount) === false) {
        return 0;
    }

    return Math.max(0, requestedClipCount - details.clips.length);
}

/** Brilho may pick fewer moments than asked; once finished, the clips that exist are the total. */
export function countClipTotal(details: VideoDetails): number {
    return details.clips.length + countPlaceholders(details);
}

/** Best first, as Brilho ranked them; ties keep the order the clips appear in the video. */
function compareByRank(first: ClipView, second: ClipView): number {
    const scoreDifference = second.score - first.score;

    if (scoreDifference !== 0) {
        return scoreDifference;
    }

    return first.startSeconds - second.startSeconds;
}

export function rankClips(clips: Array<ClipView>): Array<ClipView> {
    return clips.toSorted(compareByRank);
}

/** The clip's place in the ranking, counted from one; zero when it is not in the list. */
export function rankOfClip(rankedClips: Array<ClipView>, clipId: string): number {
    return rankedClips.findIndex((clip) => clip.id === clipId) + 1;
}

/** Start included, end excluded, so back-to-back clips never both claim the same second. */
export function findClipAt(clips: Array<ClipView>, seconds: number): ClipView | undefined {
    if (Number.isFinite(seconds) === false) {
        return undefined;
    }

    return clips.find((clip) => seconds >= clip.startSeconds && seconds < clip.endSeconds);
}
