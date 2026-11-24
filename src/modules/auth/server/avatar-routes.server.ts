import {
    AVATAR_TOO_LARGE_MESSAGE,
    MAX_AVATAR_BYTES,
    readPhotoExtension,
    toPhotoImage,
} from "#/modules/auth/model/avatar";
import type { AvatarPhotoExtension } from "#/modules/auth/model/avatar";
import {
    findUserImage,
    readAvatarPhoto,
    saveUserImage,
    writeAvatarPhoto,
} from "#/modules/auth/server/avatar-storage.server";
import {
    AVATAR_CONTENT_TYPES,
    detectAvatarFormat,
} from "#/modules/auth/server/avatar-photo-format.server";
import {
    MAX_AVATAR_SIDE_PIXELS,
    isAvatarSizeAllowed,
    readAvatarSize,
} from "#/modules/auth/server/avatar-photo-size.server";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { isFileNotFoundError } from "#/shared/server/fs-errors";
import {
    HTTP_BAD_REQUEST,
    HTTP_NOT_FOUND,
    HTTP_PAYLOAD_TOO_LARGE,
    HTTP_UNAUTHORIZED,
    HTTP_UNSUPPORTED_MEDIA_TYPE,
    errorResponse,
} from "#/shared/server/http-response";

class AvatarTooLargeError extends Error {
    constructor() {
        super(`Avatar is larger than ${MAX_AVATAR_BYTES} bytes`);
        this.name = "AvatarTooLargeError";
    }
}

/** Reads the body but stops as soon as it passes the limit, whatever Content-Length claimed. */
async function readLimitedBody(body: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    const reader = body.getReader();
    const chunks: Array<Uint8Array> = [];
    let totalBytes = 0;

    for (let chunk = await reader.read(); chunk.done === false; chunk = await reader.read()) {
        totalBytes += chunk.value.byteLength;

        if (totalBytes > MAX_AVATAR_BYTES) {
            await reader.cancel();
            throw new AvatarTooLargeError();
        }

        chunks.push(chunk.value);
    }

    return Buffer.concat(chunks);
}

async function readUpload(request: Request): Promise<Uint8Array | Response> {
    const body = request.body;

    if (body === null) {
        return errorResponse(HTTP_BAD_REQUEST, "Nenhuma foto foi enviada.");
    }

    try {
        return await readLimitedBody(body);
    } catch (error) {
        if (error instanceof AvatarTooLargeError) {
            return errorResponse(HTTP_PAYLOAD_TOO_LARGE, AVATAR_TOO_LARGE_MESSAGE);
        }

        throw error;
    }
}

async function storeAvatar(userId: string, upload: Uint8Array): Promise<Response> {
    const extension = detectAvatarFormat(upload);

    if (extension === null) {
        return errorResponse(HTTP_UNSUPPORTED_MEDIA_TYPE, "Use uma foto PNG, JPG ou WebP.");
    }

    const size = readAvatarSize(upload, extension);

    if (size === null) {
        return errorResponse(HTTP_UNSUPPORTED_MEDIA_TYPE, "Não foi possível ler essa foto.");
    }

    if (isAvatarSizeAllowed(size) === false) {
        return errorResponse(
            HTTP_PAYLOAD_TOO_LARGE,
            `A foto pode ter até ${MAX_AVATAR_SIDE_PIXELS} × ${MAX_AVATAR_SIDE_PIXELS} pixels.`,
        );
    }

    await writeAvatarPhoto(userId, extension, upload);
    const image = toPhotoImage(extension, Date.now());
    await saveUserImage(userId, image);
    return Response.json({ image });
}

/** POST /api/account/avatar with the raw image as the body. */
export async function handleAvatarUpload(request: Request): Promise<Response> {
    const user = await getSessionUser(request.headers);

    if (user === null) {
        return errorResponse(HTTP_UNAUTHORIZED, "Entre na sua conta para trocar a foto.");
    }

    const declaredLength = Number(request.headers.get("content-length"));

    if (Number.isFinite(declaredLength) === true && declaredLength > MAX_AVATAR_BYTES) {
        return errorResponse(HTTP_PAYLOAD_TOO_LARGE, AVATAR_TOO_LARGE_MESSAGE);
    }

    const upload = await readUpload(request);

    if (upload instanceof Response) {
        return upload;
    }

    return storeAvatar(user.id, upload);
}

function photoResponse(photo: Buffer, extension: AvatarPhotoExtension): Response {
    return new Response(new Uint8Array(photo), {
        headers: {
            "Content-Type": AVATAR_CONTENT_TYPES[extension],
            "Content-Length": String(photo.byteLength),
            // The URL carries a version, so a new upload is a new URL.
            "Cache-Control": "private, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        },
    });
}

/** GET /api/account/avatar — the signed-in user's own photo. */
export async function serveAvatar(request: Request): Promise<Response> {
    const user = await getSessionUser(request.headers);

    if (user === null) {
        return new Response(null, { status: HTTP_UNAUTHORIZED });
    }

    const extension = readPhotoExtension(await findUserImage(user.id));

    if (extension === null) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    try {
        return photoResponse(await readAvatarPhoto(user.id, extension), extension);
    } catch (error) {
        // The row can briefly point at a photo that a newer upload already replaced.
        if (isFileNotFoundError(error) === true) {
            return new Response(null, { status: HTTP_NOT_FOUND });
        }

        throw error;
    }
}
