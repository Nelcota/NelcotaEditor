import { findSharedClip } from "#/modules/clips/server/find-shared-clip.server";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { HTTP_NOT_FOUND } from "#/shared/server/http-response";

// Turning the link off cuts a signed link already handed out only when it expires.
const SHARED_LINK_LIFETIME_SECONDS = 10 * 60;

interface SharedFile {
    key: string;
    contentType: string;
}

/** Short cache: turning the link off should stop it working within a minute. */
function respondWithSharedFile(request: Request, file: SharedFile): Promise<Response> {
    const headers = new Headers({
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=60",
        "X-Content-Type-Options": "nosniff",
    });

    return getFileStorage().respondWithFile(request, {
        key: file.key,
        headers,
        linkLifetimeSeconds: SHARED_LINK_LIFETIME_SECONDS,
    });
}

/** GET /api/share/:token: streams a clip its owner chose to share, with no sign-in. */
export async function serveSharedClip(request: Request, token: string): Promise<Response> {
    const sharedClip = await findSharedClip(token);

    if (sharedClip === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    return respondWithSharedFile(request, { key: sharedClip.outputPath, contentType: "video/mp4" });
}

/** GET /api/share/:token/poster: the frame that link previews show for a shared clip. */
export async function serveSharedClipPoster(request: Request, token: string): Promise<Response> {
    const sharedClip = await findSharedClip(token);
    const posterPath = sharedClip?.posterPath ?? null;

    if (posterPath === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    return respondWithSharedFile(request, { key: posterPath, contentType: "image/jpeg" });
}
