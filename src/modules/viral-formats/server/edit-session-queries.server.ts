import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { videos } from "#/modules/video-records/video-records.schema";
import {
    MAX_LISTED_SESSIONS,
    MAX_QUEUED_SESSIONS_FOR_CLAUDE,
    MAX_SESSION_NOTES,
    MAX_SESSION_VIDEOS,
    toEditSessionTitle,
} from "#/modules/viral-formats/model/edit-session";
import type {
    EditSessionSummary,
    EditSessionView,
    QueuedEditSession,
    SessionNote,
    SessionVideo,
} from "#/modules/viral-formats/model/edit-session";
import { listSessionEdits } from "#/modules/viral-formats/server/edit-queries.server";
import {
    editSessionNotes,
    editSessionVideos,
    editSessions,
} from "#/modules/viral-formats/viral-formats.schema";

/** The videos module serves the frame to its owner; null until the worker took one. */
function toThumbnailUrl(videoId: string, thumbnailPath: string | null): string | null {
    if (thumbnailPath === null) {
        return null;
    }

    return `/api/videos/${videoId}/thumbnail`;
}

type SessionRow = Pick<
    typeof editSessions.$inferSelect,
    "id" | "format" | "number" | "status" | "createdAt"
>;

const SESSION_COLUMNS = {
    id: editSessions.id,
    format: editSessions.format,
    number: editSessions.number,
    status: editSessions.status,
    createdAt: editSessions.createdAt,
};

function toSummary(row: SessionRow, videoCount: number): EditSessionSummary {
    return {
        id: row.id,
        title: toEditSessionTitle(row.format, row.number),
        format: row.format,
        status: row.status,
        videoCount,
        createdAt: row.createdAt.toISOString(),
    };
}

/** The person's latest batches with how many raw videos each holds, newest first. */
export async function listUserEditSessions(userId: string): Promise<Array<EditSessionSummary>> {
    const rows = await db
        .select({ ...SESSION_COLUMNS, videoCount: count(editSessionVideos.id) })
        .from(editSessions)
        .leftJoin(editSessionVideos, eq(editSessionVideos.sessionId, editSessions.id))
        .where(eq(editSessions.userId, userId))
        .groupBy(editSessions.id)
        .orderBy(desc(editSessions.createdAt))
        .limit(MAX_LISTED_SESSIONS);

    return rows.map(({ videoCount, ...row }) => toSummary(row, videoCount));
}

/** Another person's batch and a missing one answer the same: null. */
export async function findUserSessionRow(
    userId: string,
    sessionId: string,
): Promise<SessionRow | null> {
    const rows = await db
        .select(SESSION_COLUMNS)
        .from(editSessions)
        .where(and(eq(editSessions.id, sessionId), eq(editSessions.userId, userId)))
        .limit(1);

    return rows[0] ?? null;
}

async function listSessionVideos(sessionId: string): Promise<Array<SessionVideo>> {
    const rows = await db
        .select({
            id: videos.id,
            title: videos.title,
            status: videos.status,
            progressPercent: videos.progressPercent,
            durationSeconds: videos.durationSeconds,
            sourceBytes: videos.sourceBytes,
            thumbnailPath: videos.thumbnailPath,
        })
        .from(editSessionVideos)
        .innerJoin(videos, eq(videos.id, editSessionVideos.videoId))
        .where(eq(editSessionVideos.sessionId, sessionId))
        .orderBy(asc(editSessionVideos.createdAt))
        .limit(MAX_SESSION_VIDEOS);

    return rows.map(({ thumbnailPath, ...row }) => ({
        ...row,
        thumbnailUrl: toThumbnailUrl(row.id, thumbnailPath),
        isReady: row.status === "done",
        hasFailed: row.status === "failed" || row.status === "cancelled",
    }));
}

async function listSessionNotes(sessionId: string): Promise<Array<SessionNote>> {
    const rows = await db
        .select({
            id: editSessionNotes.id,
            body: editSessionNotes.body,
            createdAt: editSessionNotes.createdAt,
        })
        .from(editSessionNotes)
        .where(eq(editSessionNotes.sessionId, sessionId))
        .orderBy(asc(editSessionNotes.createdAt))
        .limit(MAX_SESSION_NOTES);

    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

/** One batch of the person's with its videos, adjustments and the edits made from it. */
export async function findUserEditSession(
    userId: string,
    sessionId: string,
): Promise<EditSessionView | null> {
    const session = await findUserSessionRow(userId, sessionId);

    if (session === null) {
        return null;
    }

    const [sessionVideos, notes, sessionEdits] = await Promise.all([
        listSessionVideos(sessionId),
        listSessionNotes(sessionId),
        listSessionEdits(userId, sessionId),
    ]);

    return {
        ...toSummary(session, sessionVideos.length),
        videos: sessionVideos,
        notes,
        edits: sessionEdits,
    };
}

/**
 * The person's batches waiting for their Claude, oldest first, each with its adjustments and the
 * videos still to edit. A video counts as edited once an edit of it came from the batch.
 */
export async function listQueuedEditSessions(userId: string): Promise<Array<QueuedEditSession>> {
    const rows = await db
        .select({ id: editSessions.id })
        .from(editSessions)
        .where(and(eq(editSessions.userId, userId), eq(editSessions.status, "queued")))
        .orderBy(asc(editSessions.createdAt))
        .limit(MAX_QUEUED_SESSIONS_FOR_CLAUDE);
    const sessions = await Promise.all(rows.map((row) => findUserEditSession(userId, row.id)));

    return sessions
        .filter((session) => session !== null)
        .map((session) => {
            const editedVideoIds = new Set(session.edits.map((edit) => edit.videoId));

            return {
                sessionId: session.id,
                title: session.title,
                format: session.format,
                adjustments: session.notes.map((note) => note.body),
                videos: session.videos.map((video) => ({
                    videoId: video.id,
                    title: video.title,
                    durationSeconds: video.durationSeconds,
                    isTranscribed: video.isReady,
                    hasEdit: editedVideoIds.has(video.id),
                })),
            };
        });
}
