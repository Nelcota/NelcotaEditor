import path from "node:path";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { isOriginalPlayable } from "#/modules/videos/video-status";
import { videos } from "#/modules/videos/videos.schema";
import { respondWithFileRange } from "#/shared/server/serve-file-range.server";
import { resolveStoragePath } from "#/shared/server/storage.server";

const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;

const videoIdSchema = z.uuid();

/** The browser decides from the type whether it can play the file; unknown ones get a generic type. */
const CONTENT_TYPES: Record<string, string> = {
    ".mp4": "video/mp4",
    ".m4v": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
};

const FALLBACK_CONTENT_TYPE = "application/octet-stream";

async function findOwnedSourcePath(videoId: string, userId: string): Promise<string | null> {
    const rows = await db
        .select({ sourcePath: videos.sourcePath, status: videos.status })
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .limit(1);
    const row = rows[0];

    // While it is still downloading, the file on disk is incomplete.
    if (row === undefined || row.sourcePath === null || isOriginalPlayable(row.status) === false) {
        return null;
    }

    return row.sourcePath;
}

function toContentType(sourcePath: string): string {
    const extension = path.extname(sourcePath).toLowerCase();

    return CONTENT_TYPES[extension] ?? FALLBACK_CONTENT_TYPE;
}

/** GET /api/videos/:videoId/source — streams the original video to its owner, with seeking. */
export async function serveVideoSource(request: Request, videoId: string): Promise<Response> {
    const user = await getSessionUser(request.headers);

    if (user === null) {
        return new Response(null, { status: HTTP_UNAUTHORIZED });
    }

    const videoIdResult = videoIdSchema.safeParse(videoId);

    if (videoIdResult.success === false) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const sourcePath = await findOwnedSourcePath(videoIdResult.data, user.id);

    if (sourcePath === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const headers = new Headers({
        "Content-Type": toContentType(sourcePath),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
    });

    return respondWithFileRange(request, resolveStoragePath(sourcePath), headers);
}
