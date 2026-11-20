import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import type { Clip } from "#/modules/clips/clips.schema";
import { isOriginalPlayable, isVideoWorking } from "#/modules/videos/video-status";
import { toYoutubeThumbnailUrl } from "#/modules/videos/youtube-preview";
import { toYoutubeVideoId } from "#/modules/videos/youtube-url";
import type { ClipView, VideoSummary } from "#/modules/videos/video-views";
import { videos } from "#/modules/videos/videos.schema";
import type { Video } from "#/modules/videos/videos.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

/** Ownership is always checked with the session user id, never with an id sent by the client. */
export async function findOwnedVideo(videoId: string, userId: string): Promise<Video> {
    const rows = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .limit(1);
    const video = rows[0];

    if (video === undefined) {
        throw new UserFacingError("Vídeo não encontrado.");
    }

    return video;
}

/** The worker's frame when there is one; for YouTube links, YouTube's own thumbnail meanwhile. */
function toThumbnailUrl(video: Video): string | null {
    if (video.thumbnailPath !== null) {
        return `/api/videos/${video.id}/thumbnail`;
    }

    const sourceUrl = video.sourceUrl;

    if (sourceUrl === null) {
        return null;
    }

    const youtubeId = toYoutubeVideoId(sourceUrl);

    if (youtubeId === null) {
        return null;
    }

    return toYoutubeThumbnailUrl(youtubeId);
}

function toOriginalFileUrl(video: Video): string | null {
    if (video.sourcePath === null || isOriginalPlayable(video.status) === false) {
        return null;
    }

    return `/api/videos/${video.id}/source`;
}

export function toVideoSummary(video: Video, readyClipCount: number): VideoSummary {
    return {
        id: video.id,
        title: video.title,
        source: video.source,
        status: video.status,
        progressPercent: video.progressPercent,
        errorMessage: video.errorMessage,
        isCancelling: video.cancelRequested && isVideoWorking(video.status),
        durationSeconds: video.durationSeconds,
        requestedClipCount: video.requestedClipCount,
        readyClipCount,
        createdAt: video.createdAt.toISOString(),
        sourceUrl: video.sourceUrl,
        thumbnailUrl: toThumbnailUrl(video),
        originalFileUrl: toOriginalFileUrl(video),
    };
}

function toSharePath(clip: Clip): string | null {
    if (clip.shareToken === null) {
        return null;
    }

    return `/api/share/${clip.shareToken}`;
}

export function toClipView(clip: Clip): ClipView {
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

export async function listUserVideos(userId: string): Promise<Array<Video>> {
    return db
        .select()
        .from(videos)
        .where(eq(videos.userId, userId))
        .orderBy(desc(videos.createdAt));
}

export async function countReadyClips(videoIds: Array<string>): Promise<Map<string, number>> {
    if (videoIds.length === 0) {
        return new Map();
    }

    const rows = await db
        .select({ videoId: clips.videoId, readyCount: count() })
        .from(clips)
        .where(and(inArray(clips.videoId, videoIds), eq(clips.status, "done")))
        .groupBy(clips.videoId);

    return new Map(rows.map((row) => [row.videoId, row.readyCount]));
}

export async function listVideoClips(videoId: string): Promise<Array<Clip>> {
    return db.select().from(clips).where(eq(clips.videoId, videoId)).orderBy(asc(clips.position));
}
