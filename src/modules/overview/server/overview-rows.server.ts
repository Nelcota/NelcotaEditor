import { and, count, eq, gte, inArray, notInArray, or } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import type { Clip } from "#/modules/clips/clips.schema";
import { transcripts } from "#/modules/transcription/transcription.schema";
import { FINISHED_VIDEO_STATUSES } from "#/modules/video-records/model/video-status";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";

export interface OverviewVideoRow {
    id: string;
    status: VideoStatus;
    createdAt: Date;
    firstFinishedAt: Date | null;
    durationSeconds: number | null;
    hasTranscript: boolean;
}

/**
 * Finished videos created or first finished since `since`; in-progress ones stay out of the
 * numbers.
 */
export async function listFinishedVideos(
    userId: string,
    since: Date,
): Promise<Array<OverviewVideoRow>> {
    const rows = await db
        .select({
            id: videos.id,
            status: videos.status,
            createdAt: videos.createdAt,
            firstFinishedAt: videos.firstFinishedAt,
            durationSeconds: videos.durationSeconds,
            transcriptVideoId: transcripts.videoId,
        })
        .from(videos)
        .leftJoin(transcripts, eq(transcripts.videoId, videos.id))
        .where(
            and(
                eq(videos.userId, userId),
                eq(videos.purpose, "clips"),
                inArray(videos.status, FINISHED_VIDEO_STATUSES),
                or(gte(videos.createdAt, since), gte(videos.firstFinishedAt, since)),
            ),
        );

    return rows.map(({ transcriptVideoId, ...row }) => ({
        ...row,
        hasTranscript: transcriptVideoId !== null,
    }));
}

/** Every clip (any status) of the given videos, to know which videos got moments picked. */
export async function listClipStatuses(
    videoIds: Array<string>,
): Promise<Array<{ videoId: string; status: Clip["status"] }>> {
    if (videoIds.length === 0) {
        return [];
    }

    return db
        .select({ videoId: clips.videoId, status: clips.status })
        .from(clips)
        .where(inArray(clips.videoId, videoIds));
}

export async function countVideos(userId: string): Promise<{ total: number; inProgress: number }> {
    const [totalRows, inProgressRows] = await Promise.all([
        db
            .select({ total: count() })
            .from(videos)
            .where(and(eq(videos.userId, userId), eq(videos.purpose, "clips"))),
        db
            .select({ inProgress: count() })
            .from(videos)
            .where(
                and(
                    eq(videos.userId, userId),
                    eq(videos.purpose, "clips"),
                    notInArray(videos.status, FINISHED_VIDEO_STATUSES),
                ),
            ),
    ]);

    return { total: totalRows[0]?.total ?? 0, inProgress: inProgressRows[0]?.inProgress ?? 0 };
}
