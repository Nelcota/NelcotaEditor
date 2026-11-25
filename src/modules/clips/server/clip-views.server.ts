import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db } from "#/db/database.server";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { toSharedClipPagePath } from "#/modules/clips/model/shared-clip";
import { clips } from "#/modules/clips/clips.schema";
import type { Clip } from "#/modules/clips/clips.schema";
import { FINISHED_VIDEO_STATUSES } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";

/**
 * The clip columns a ClipView needs. Lists are polled every few seconds, and a full row also
 * carries the caption cues and the Studio draft (hundreds of words each) that no list shows.
 */
export const CLIP_VIEW_COLUMNS = {
    id: clips.id,
    position: clips.position,
    title: clips.title,
    reason: clips.reason,
    startSeconds: clips.startSeconds,
    endSeconds: clips.endSeconds,
    score: clips.score,
    status: clips.status,
    aspectRatio: clips.aspectRatio,
    captionStyle: clips.captionStyle,
    outputPath: clips.outputPath,
    shareToken: clips.shareToken,
    createdAt: clips.createdAt,
};

export type ClipViewRow = Pick<Clip, keyof typeof CLIP_VIEW_COLUMNS>;

function toSharePath(clip: ClipViewRow): string | null {
    if (clip.shareToken === null) {
        return null;
    }

    return toSharedClipPagePath(clip.shareToken);
}

export function toClipView(clip: ClipViewRow): ClipView {
    const clipView: ClipView = {
        id: clip.id,
        position: clip.position,
        title: clip.title,
        reason: clip.reason,
        startSeconds: clip.startSeconds,
        endSeconds: clip.endSeconds,
        score: clip.score,
        status: clip.status,
        aspectRatio: clip.aspectRatio,
        captionStyle: clip.captionStyle,
        fileUrl: null,
        downloadUrl: null,
        sharePath: null,
        isShared: clip.shareToken !== null,
    };

    if (clip.status !== "done" || clip.outputPath === null) {
        return clipView;
    }

    const fileUrl = `/api/clips/${clip.id}/file`;

    return {
        ...clipView,
        fileUrl,
        downloadUrl: `${fileUrl}?download=1`,
        sharePath: toSharePath(clip),
    };
}

export async function listVideoClips(videoId: string): Promise<Array<ClipViewRow>> {
    return db
        .select(CLIP_VIEW_COLUMNS)
        .from(clips)
        .where(eq(clips.videoId, videoId))
        .orderBy(asc(clips.position));
}

export interface ReadyClipRow {
    clip: ClipViewRow;
    videoId: string;
    videoTitle: string;
}

/**
 * The user's ready clips created since `since`, with the video each one came from. Only videos
 * that finished count, like the Painel's video numbers: a clip of a video still in progress (or
 * re-rendering) joins once the video ends.
 */
export async function listReadyClipsSince(
    userId: string,
    since: Date,
): Promise<Array<ReadyClipRow>> {
    return db
        .select({ clip: CLIP_VIEW_COLUMNS, videoId: videos.id, videoTitle: videos.title })
        .from(clips)
        .innerJoin(videos, eq(videos.id, clips.videoId))
        .where(
            and(
                eq(videos.userId, userId),
                inArray(videos.status, FINISHED_VIDEO_STATUSES),
                eq(clips.status, "done"),
                gte(clips.createdAt, since),
            ),
        );
}
