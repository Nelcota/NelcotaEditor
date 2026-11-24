import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { clips } from "#/modules/clips/clips.schema";
import { videos } from "#/modules/video-records/video-records.schema";
import { OWNER_LINK_LIFETIME_SECONDS } from "#/shared/server/file-storage/file-storage";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "#/shared/server/http-response";

const MAX_DOWNLOAD_NAME_LENGTH = 80;
const FALLBACK_DOWNLOAD_NAME = "corte";
const DOWNLOAD_EXTENSION = ".mp4";
const DOWNLOAD_FLAG_VALUE = "1";
// NFD splits "é" into "e" plus a combining accent; dropping the accents keeps the letters.
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const UNSAFE_NAME_CHARACTERS = /[^a-zA-Z0-9 _-]/g;

const clipIdSchema = z.uuid();

interface OwnedClipFile {
    title: string;
    outputPath: string;
}

async function findOwnedClipFile(clipId: string, userId: string): Promise<OwnedClipFile | null> {
    const rows = await db
        .select({ title: clips.title, outputPath: clips.outputPath })
        .from(clips)
        .innerJoin(videos, eq(videos.id, clips.videoId))
        .where(and(eq(clips.id, clipId), eq(videos.userId, userId), eq(clips.status, "done")))
        .limit(1);
    const row = rows[0];

    if (row === undefined || row.outputPath === null) {
        return null;
    }

    return { title: row.title, outputPath: row.outputPath };
}

/** Keeps only safe characters so the title can go in a Content-Disposition header. */
function toDownloadName(title: string): string {
    const safeName = title
        .normalize("NFD")
        .replace(COMBINING_MARKS, "")
        .replace(UNSAFE_NAME_CHARACTERS, "")
        .trim()
        .slice(0, MAX_DOWNLOAD_NAME_LENGTH);

    if (safeName.length === 0) {
        return `${FALLBACK_DOWNLOAD_NAME}${DOWNLOAD_EXTENSION}`;
    }

    return `${safeName}${DOWNLOAD_EXTENSION}`;
}

function buildHeaders(clipFile: OwnedClipFile, isDownload: boolean): Headers {
    const headers = new Headers({
        "Content-Type": "video/mp4",
        // A Studio render rewrites this same file: revalidate (a cheap 304 via Last-Modified)
        // instead of replaying the old cut from the cache for up to an hour.
        "Cache-Control": "private, no-cache",
        "X-Content-Type-Options": "nosniff",
    });

    if (isDownload === true) {
        headers.set(
            "Content-Disposition",
            `attachment; filename="${toDownloadName(clipFile.title)}"`,
        );
    }

    return headers;
}

async function respondWithClip(request: Request, clipFile: OwnedClipFile): Promise<Response> {
    const isDownload = new URL(request.url).searchParams.get("download") === DOWNLOAD_FLAG_VALUE;
    const headers = buildHeaders(clipFile, isDownload);

    return getFileStorage().respondWithFile(request, {
        key: clipFile.outputPath,
        headers,
        linkLifetimeSeconds: OWNER_LINK_LIFETIME_SECONDS,
    });
}

/** GET /api/clips/:clipId/file — streams a rendered clip to its owner (add ?download=1 to save it). */
export async function serveClipFile(request: Request, clipId: string): Promise<Response> {
    const user = await getSessionUser(request.headers);

    if (user === null) {
        return new Response(null, { status: HTTP_UNAUTHORIZED });
    }

    const clipIdResult = clipIdSchema.safeParse(clipId);

    if (clipIdResult.success === false) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const clipFile = await findOwnedClipFile(clipIdResult.data, user.id);

    if (clipFile === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    return respondWithClip(request, clipFile);
}
