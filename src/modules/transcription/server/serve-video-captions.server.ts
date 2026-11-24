import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { buildWebVtt } from "#/modules/transcription/model/build-web-vtt";
import { findTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "#/shared/server/http-response";

const videoIdSchema = z.uuid();

async function isOwnedVideo(videoId: string, userId: string): Promise<boolean> {
    const rows = await db
        .select({ id: videos.id })
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .limit(1);

    return rows.length > 0;
}

/** GET /api/videos/:videoId/captions: the transcript as WebVTT, for the video's owner only. */
export async function serveVideoCaptions(request: Request, videoId: string): Promise<Response> {
    const user = await getSessionUser(request.headers);

    if (user === null) {
        return new Response(null, { status: HTTP_UNAUTHORIZED });
    }

    const videoIdResult = videoIdSchema.safeParse(videoId);

    if (videoIdResult.success === false) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const ownedVideoId = videoIdResult.data;

    if ((await isOwnedVideo(ownedVideoId, user.id)) === false) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const words = await findTranscriptWords(ownedVideoId);

    if (words === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    return new Response(buildWebVtt(words), {
        headers: {
            "Content-Type": "text/vtt; charset=utf-8",
            // The transcript is written once, after transcribing; it never changes afterwards.
            "Cache-Control": "private, max-age=86400",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
