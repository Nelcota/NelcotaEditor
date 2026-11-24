import { z } from "zod";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { findOwnedPendingUpload } from "#/modules/videos/server/pending-uploads.server";
import {
    EmptyUploadError,
    UploadLargerThanDeclaredError,
    storeVideoUpload,
} from "#/modules/videos/server/store-video-upload.server";
import { getEnvironment } from "#/shared/server/env.server";
import {
    HTTP_BAD_REQUEST,
    HTTP_NOT_FOUND,
    HTTP_PAYLOAD_TOO_LARGE,
    HTTP_UNAUTHORIZED,
    errorResponse,
} from "#/shared/server/http-response";

const HTTP_NO_CONTENT = 204;
const uploadIdSchema = z.uuid();

/** Turns the upload errors the user can fix into responses; anything else propagates. */
function toUploadErrorResponse(error: unknown): Response {
    if (error instanceof UploadLargerThanDeclaredError) {
        return errorResponse(
            HTTP_PAYLOAD_TOO_LARGE,
            "O arquivo mudou durante o envio. Envie de novo.",
        );
    }

    if (error instanceof EmptyUploadError) {
        return errorResponse(HTTP_BAD_REQUEST, "O arquivo enviado está vazio.");
    }

    throw error;
}

/**
 * PUT /api/videos/uploads/:uploadId/file — the file of a reserved upload, for a store that takes
 * files only through the app (the disk). The reservation already checked the limits.
 */
export async function receiveUploadFile(request: Request, uploadId: string): Promise<Response> {
    // A store with signed links never needs this route; open, it would let one upload send many
    // bodies at once, each spooled to this server's disk before it reaches the store.
    if (getEnvironment().STORAGE_DRIVER !== "disk") {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const user = await getSessionUser(request.headers);

    if (user === null) {
        return errorResponse(HTTP_UNAUTHORIZED, "Entre na sua conta para enviar vídeos.");
    }

    const uploadIdResult = uploadIdSchema.safeParse(uploadId);

    if (uploadIdResult.success === false) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const upload = await findOwnedPendingUpload(uploadIdResult.data, user.id);

    if (upload === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const body = request.body;

    if (body === null) {
        return errorResponse(HTTP_BAD_REQUEST, "Nenhum arquivo foi enviado.");
    }

    try {
        await storeVideoUpload(body, {
            sourcePath: upload.sourcePath,
            maxBytes: upload.declaredBytes,
        });
    } catch (error) {
        return toUploadErrorResponse(error);
    }

    return new Response(null, { status: HTTP_NO_CONTENT });
}
