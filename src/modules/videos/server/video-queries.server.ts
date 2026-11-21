import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import { isOriginalPlayable, isVideoWorking } from "#/modules/video-records/video-status";
import { toYoutubeThumbnailUrl } from "#/modules/videos/youtube-preview";
import { toYoutubeVideoId } from "#/modules/videos/youtube-url";
import type { VideoSummary } from "#/modules/videos/video-views";
import { videos } from "#/modules/video-records/videos.schema";
import type { Video } from "#/modules/video-records/videos.schema";

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
        clipLength: video.clipLength,
        readyClipCount,
        createdAt: video.createdAt.toISOString(),
        processingStartedAt: video.processingStartedAt?.toISOString() ?? null,
        sourceUrl: video.sourceUrl,
        thumbnailUrl: toThumbnailUrl(video),
        originalFileUrl: toOriginalFileUrl(video),
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
