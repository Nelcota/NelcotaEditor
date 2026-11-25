import { z } from "zod";
import type { TranscriptionLanguage } from "#/modules/preferences/model/preferences";
import type { ClipLength } from "#/modules/video-records/model/clip-length";
import type { StartedVideoUpload } from "#/modules/videos/model/video-upload-input";
import { UploadCancelledError } from "#/modules/videos/model/upload-cancelled-error";
import {
    cancelVideoUpload,
    completeVideoUpload,
    startVideoUpload,
} from "#/modules/videos/server/video-upload-functions";

const uploadFailureSchema = z.object({ error: z.string() });

const MIN_SUCCESS_STATUS = 200;
const MAX_SUCCESS_STATUS = 299;
const PERCENT = 100;
const NETWORK_ERROR_MESSAGE = "A conexão caiu durante o envio. Tente de novo.";
const UNKNOWN_ERROR_MESSAGE = "Não foi possível enviar o vídeo. Tente de novo.";
const ABORTED_MESSAGE = "O envio foi interrompido. Tente de novo.";
const EMPTY_FILE_MESSAGE = "O arquivo escolhido está vazio. Escolha outro arquivo.";

export interface UploadVideoInput {
    file: File;
    title: string;
    clipCount: number;
    clipLength: ClipLength;
    language: TranscriptionLanguage;
}

export class UploadFailedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UploadFailedError";
    }
}

/** Storage answers in XML and a proxy with an HTML page; only the app's JSON error is shown. */
function parseJson(text: string): unknown {
    try {
        const parsed: unknown = JSON.parse(text);
        return parsed;
    } catch {
        return null;
    }
}

function readUploadFailure(request: XMLHttpRequest): UploadFailedError {
    const failure = uploadFailureSchema.safeParse(parseJson(request.responseText));

    if (failure.success === true) {
        return new UploadFailedError(failure.data.error);
    }

    return new UploadFailedError(UNKNOWN_ERROR_MESSAGE);
}

interface FileTarget extends Pick<StartedVideoUpload, "uploadUrl" | "uploadHeaders"> {
    file: File;
    signal: AbortSignal;
}

/**
 * PUTs the raw file with XMLHttpRequest because fetch cannot report upload progress. The URL is
 * either a signed storage link (no cookies needed) or the app's own route (same origin).
 */
function sendFile(target: FileTarget, onProgress: (percent: number) => void): Promise<void> {
    const { uploadUrl, uploadHeaders, file, signal } = target;

    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        const abortRequest = (): void => request.abort();

        signal.addEventListener("abort", abortRequest, { once: true });
        request.addEventListener("loadend", () =>
            signal.removeEventListener("abort", abortRequest),
        );
        request.open("PUT", uploadUrl);

        for (const [header, value] of Object.entries(uploadHeaders ?? {})) {
            request.setRequestHeader(header, value);
        }

        request.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable === true && event.total > 0) {
                onProgress(Math.round((event.loaded / event.total) * PERCENT));
            }
        });
        request.addEventListener("load", () => {
            if (request.status >= MIN_SUCCESS_STATUS && request.status <= MAX_SUCCESS_STATUS) {
                resolve();
                return;
            }

            reject(readUploadFailure(request));
        });
        request.addEventListener("error", () =>
            reject(new UploadFailedError(NETWORK_ERROR_MESSAGE)),
        );
        // Without these the promise would never settle if the browser aborts or times out.
        request.addEventListener("abort", () => {
            if (signal.aborted === true) {
                reject(new UploadCancelledError());
                return;
            }

            reject(new UploadFailedError(ABORTED_MESSAGE));
        });
        request.addEventListener("timeout", () =>
            reject(new UploadFailedError(NETWORK_ERROR_MESSAGE)),
        );
        request.send(file);
    });
}

/**
 * Frees the slot right away instead of when the reservation expires. Its own failure is not
 * shown: the upload error is the one the person can act on, and the reservation expires anyway.
 */
async function releaseUpload(uploadId: string): Promise<void> {
    await Promise.allSettled([cancelVideoUpload({ data: { uploadId } })]);
}

function assertNotCancelled(signal: AbortSignal): void {
    if (signal.aborted === true) {
        throw new UploadCancelledError();
    }
}

/**
 * Reserves the upload, sends the file where the server says, then confirms it. Cancelling through
 * the signal stops the transfer and frees the reservation, up to the confirmation, which is
 * left to finish since the video may already exist.
 * Resolves with the id of the created video.
 */
export async function uploadVideoFile(
    input: UploadVideoInput,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
): Promise<string> {
    const file = input.file;

    if (file.size === 0) {
        throw new UploadFailedError(EMPTY_FILE_MESSAGE);
    }

    assertNotCancelled(signal);
    const started = await startVideoUpload({
        data: {
            fileName: file.name,
            title: input.title,
            sizeBytes: file.size,
            clipCount: input.clipCount,
            clipLength: input.clipLength,
            language: input.language,
        },
    });
    const uploadId = started.uploadId;

    try {
        assertNotCancelled(signal);
        await sendFile({ ...started, file, signal }, onProgress);
        assertNotCancelled(signal);
    } catch (error) {
        await releaseUpload(uploadId);
        throw error;
    }

    const completed = await completeVideoUpload({ data: { uploadId } });
    return completed.videoId;
}
