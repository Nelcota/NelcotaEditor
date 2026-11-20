import { readFile } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { videos } from "#/modules/videos/videos.schema";
import { resolveStoragePath } from "#/shared/server/storage.server";

const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const MISSING_FILE_CODE = "ENOENT";

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

function isMissingFileError(error: unknown): boolean {
    return error instanceof Error && "code" in error && error.code === MISSING_FILE_CODE;
}

/** The row can outlive its file (storage cleaned by hand); that is a 404, not a server error. */
async function readThumbnail(thumbnailPath: string): Promise<Buffer | null> {
    try {
        return await readFile(resolveStoragePath(thumbnailPath));
    } catch (error) {
        if (isMissingFileError(error) === true) {
            return null;
        }

        throw error;
    }
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

    const image = await readThumbnail(thumbnailPath);

    if (image === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    return new Response(new Uint8Array(image), {
        headers: {
            "Content-Type": "image/jpeg",
            "Content-Length": String(image.byteLength),
            "Cache-Control": "private, max-age=86400",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
