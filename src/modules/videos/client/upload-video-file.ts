import { z } from "zod";
import type { TranscriptionLanguage } from "#/modules/preferences/preferences";

const uploadSuccessSchema = z.object({ videoId: z.uuid() });
const uploadFailureSchema = z.object({ error: z.string() });

const HTTP_CREATED = 201;
const PERCENT = 100;
const NETWORK_ERROR_MESSAGE = "A conexão caiu durante o envio. Tente de novo.";
const UNKNOWN_ERROR_MESSAGE = "Não foi possível enviar o vídeo. Tente de novo.";
const ABORTED_MESSAGE = "O envio foi interrompido. Tente de novo.";
const EMPTY_FILE_MESSAGE = "O arquivo escolhido está vazio. Escolha outro arquivo.";
const UPLOAD_ENDPOINT = "/api/videos/upload";

export interface UploadVideoInput {
    file: File;
    title: string;
    clipCount: number;
    language: TranscriptionLanguage;
}

export class UploadFailedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UploadFailedError";
    }
}

/** A proxy error page is not JSON; null then falls through to the generic upload message. */
function parseJson(text: string): unknown {
    try {
        const parsed: unknown = JSON.parse(text);
        return parsed;
    } catch {
        return null;
    }
}

function readUploadResult(request: XMLHttpRequest): string {
    const body = parseJson(request.responseText);
    const success = uploadSuccessSchema.safeParse(body);

    if (request.status === HTTP_CREATED && success.success === true) {
        return success.data.videoId;
    }

    const failure = uploadFailureSchema.safeParse(body);

    if (failure.success === true) {
        throw new UploadFailedError(failure.data.error);
    }

    throw new UploadFailedError(UNKNOWN_ERROR_MESSAGE);
}

/**
 * Sends the raw file with XMLHttpRequest because fetch cannot report upload progress.
 * Resolves with the id of the created video.
 */
export function uploadVideoFile(
    input: UploadVideoInput,
    onProgress: (percent: number) => void,
): Promise<string> {
    const file = input.file;

    if (file.size === 0) {
        return Promise.reject(new UploadFailedError(EMPTY_FILE_MESSAGE));
    }

    const searchParams = new URLSearchParams({
        fileName: file.name,
        title: input.title,
        clipCount: String(input.clipCount),
        language: input.language,
    });

    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();

        request.open("POST", `${UPLOAD_ENDPOINT}?${searchParams.toString()}`);
        request.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable === true && event.total > 0) {
                onProgress(Math.round((event.loaded / event.total) * PERCENT));
            }
        });
        request.addEventListener("load", () => {
            try {
                resolve(readUploadResult(request));
            } catch (error) {
                reject(error);
            }
        });
        request.addEventListener("error", () =>
            reject(new UploadFailedError(NETWORK_ERROR_MESSAGE)),
        );
        // Without these the promise would never settle if the browser aborts or times out.
        request.addEventListener("abort", () => reject(new UploadFailedError(ABORTED_MESSAGE)));
        request.addEventListener("timeout", () =>
            reject(new UploadFailedError(NETWORK_ERROR_MESSAGE)),
        );
        request.send(file);
    });
}
