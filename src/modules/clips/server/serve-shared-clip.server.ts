import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { HTTP_NOT_FOUND } from "#/shared/server/http-response";

// 24 random bytes in base64url are always 32 characters.
// Turning the link off cuts a signed link already handed out only when it expires.
const SHARED_LINK_LIFETIME_SECONDS = 10 * 60;

const shareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32}$/);

async function findSharedOutputPath(shareToken: string): Promise<string | null> {
    const rows = await db
        .select({ outputPath: clips.outputPath })
        .from(clips)
        .where(and(eq(clips.shareToken, shareToken), eq(clips.status, "done")))
        .limit(1);

    return rows[0]?.outputPath ?? null;
}

/** GET /api/share/:token — streams a clip its owner chose to share, with no sign-in. */
export async function serveSharedClip(request: Request, token: string): Promise<Response> {
    const tokenResult = shareTokenSchema.safeParse(token);

    if (tokenResult.success === false) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const outputPath = await findSharedOutputPath(tokenResult.data);

    if (outputPath === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    // Short cache: turning the link off should stop it working within a minute.
    const headers = new Headers({
        "Content-Type": "video/mp4",
        "Cache-Control": "public, max-age=60",
        "X-Content-Type-Options": "nosniff",
    });

    return getFileStorage().respondWithFile(request, {
        key: outputPath,
        headers,
        linkLifetimeSeconds: SHARED_LINK_LIFETIME_SECONDS,
    });
}
