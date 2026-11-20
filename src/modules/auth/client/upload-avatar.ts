import { z } from "zod";

const uploadSuccessSchema = z.object({ image: z.string() });
const uploadFailureSchema = z.object({ error: z.string() });

const UNKNOWN_ERROR_MESSAGE = "Não foi possível enviar a foto. Tente novamente.";

export class AvatarUploadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AvatarUploadError";
    }
}

const AVATAR_UPLOAD_URL = "/api/account/avatar";

async function readJson(response: Response): Promise<unknown> {
    try {
        const parsed: unknown = await response.json();
        return parsed;
    } catch (error) {
        // A proxy error page is not JSON; the caller then shows the generic message.
        console.warn("Avatar upload answered with a body that is not JSON", error);
        return null;
    }
}

async function sendAvatar(file: File): Promise<Response> {
    try {
        return await fetch(AVATAR_UPLOAD_URL, { method: "POST", body: file });
    } catch (error) {
        // Offline or the connection dropped: the browser's own message is not for people.
        console.warn("Avatar upload request failed", error);
        throw new AvatarUploadError(UNKNOWN_ERROR_MESSAGE);
    }
}

/** Sends the raw image; the server checks its real format and size again. */
export async function uploadAvatar(file: File): Promise<void> {
    const response = await sendAvatar(file);
    const body = await readJson(response);

    if (response.ok === true && uploadSuccessSchema.safeParse(body).success === true) {
        return;
    }

    const failure = uploadFailureSchema.safeParse(body);

    if (failure.success === true) {
        throw new AvatarUploadError(failure.data.error);
    }

    throw new AvatarUploadError(UNKNOWN_ERROR_MESSAGE);
}
