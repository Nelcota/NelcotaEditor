import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "#/shared/server/http-response";

const videoIdSchema = z.uuid();

async function findOwnedThumbnailPath(videoId: string, userId: string): Promise<string | null> {
    const rows = await db
        .select({ thumbnailPath: videos.thumbnailPath })
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .limit(1);
    const row = rows[0];

    if (row === undefined) {
        return null;
    }

    return row.thumbnailPath;
}

/** GET /api/videos/:videoId/thumbnail — the frame the worker saved, for the video's owner only. */
export async function serveVideoThumbnail(request: Request, videoId: string): Promise<Response> {
    const user = await getSessionUser(request.headers);

    if (user === null) {
        return new Response(null, { status: HTTP_UNAUTHORIZED });
    }

    const videoIdResult = videoIdSchema.safeParse(videoId);

    if (videoIdResult.success === false) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const thumbnailPath = await findOwnedThumbnailPath(videoIdResult.data, user.id);

    if (thumbnailPath === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const headers = new Headers({
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
    });

    return getFileStorage().respondWithFile(request, thumbnailPath, headers);
}
