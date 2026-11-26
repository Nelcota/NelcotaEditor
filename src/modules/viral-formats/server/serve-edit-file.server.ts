import { z } from "zod";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { findUserEditFile } from "#/modules/viral-formats/server/edit-queries.server";
import { OWNER_LINK_LIFETIME_SECONDS } from "#/shared/server/file-storage/file-storage";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "#/shared/server/http-response";

const MAX_DOWNLOAD_NAME_LENGTH = 80;
const FALLBACK_DOWNLOAD_NAME = "edicao";
const DOWNLOAD_EXTENSION = ".mp4";
const DOWNLOAD_FLAG_VALUE = "1";
// NFD splits "é" into "e" plus a combining accent; dropping the accents keeps the letters.
const COMBINING_MARKS = /[̀-ͯ]/g;
const UNSAFE_NAME_CHARACTERS = /[^a-zA-Z0-9 _-]/g;

const editIdSchema = z.uuid();

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

/** GET /api/edits/:editId/file — streams a finished edit to its owner (?download=1 saves it). */
export async function serveEditFile(request: Request, editId: string): Promise<Response> {
    const user = await getSessionUser(request.headers);

    if (user === null) {
        return new Response(null, { status: HTTP_UNAUTHORIZED });
    }

    const editIdResult = editIdSchema.safeParse(editId);

    if (editIdResult.success === false) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const file = await findUserEditFile(user.id, editIdResult.data);

    if (file === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const headers = new Headers({
        "Content-Type": "video/mp4",
        "Cache-Control": "private, no-cache",
        "X-Content-Type-Options": "nosniff",
    });

    if (new URL(request.url).searchParams.get("download") === DOWNLOAD_FLAG_VALUE) {
        headers.set("Content-Disposition", `attachment; filename="${toDownloadName(file.title)}"`);
    }

    return getFileStorage().respondWithFile(request, {
        key: file.outputPath,
        headers,
        linkLifetimeSeconds: OWNER_LINK_LIFETIME_SECONDS,
    });
}
