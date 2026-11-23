import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { TRANSCRIPTION_LANGUAGES } from "#/modules/preferences/preferences";
import { enqueueVideoProcessing } from "#/modules/processing/server/video-processing-queue.server";
import {
    TooManyVideosInProgressError,
    assertCanStartAnotherVideo,
} from "#/modules/videos/server/processing-limit.server";
import {
    StorageQuotaExceededError,
    assertStorageAvailable,
} from "#/modules/videos/server/storage-quota.server";
import {
    EmptyUploadError,
    UploadTooLargeError,
    removeVideoDirectory,
    storeVideoUpload,
} from "#/modules/videos/server/store-video-upload.server";
import type { StoredUpload } from "#/modules/videos/server/store-video-upload.server";
import { reserveUploadSpace } from "#/modules/videos/server/reserve-upload-space.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";
import {
    ALLOWED_VIDEO_EXTENSIONS,
    MAX_TITLE_LENGTH,
    MAX_UPLOAD_BYTES,
} from "#/modules/video-records/upload-limits";
import { MAX_CLIP_COUNT, MIN_CLIP_COUNT } from "#/modules/video-records/video-status";
import { videos } from "#/modules/video-records/videos.schema";
import { CLIP_LENGTHS } from "#/modules/video-records/clip-length";
import { truncateText } from "#/modules/video-records/video-title";
import {
    HTTP_BAD_REQUEST,
    HTTP_CREATED,
    HTTP_PAYLOAD_TOO_LARGE,
    HTTP_TOO_MANY_REQUESTS,
    HTTP_UNAUTHORIZED,
    HTTP_UNSUPPORTED_MEDIA_TYPE,
    errorResponse,
} from "#/shared/server/http-response";

const MAX_FILE_NAME_LENGTH = 255;
const HTTP_LENGTH_REQUIRED = 411;
const DECIMAL_DIGITS_PATTERN = /^\d+$/;

const uploadQuerySchema = z.object({
    fileName: z.string().trim().min(1).max(MAX_FILE_NAME_LENGTH),
    title: z.string().trim().max(MAX_TITLE_LENGTH).default(""),
    clipCount: z.coerce.number().int().min(MIN_CLIP_COUNT).max(MAX_CLIP_COUNT),
    clipLength: z.enum(CLIP_LENGTHS),
    language: z.enum(TRANSCRIPTION_LANGUAGES),
});

type UploadQuery = z.infer<typeof uploadQuerySchema>;

const TOO_LARGE_MESSAGE = "O arquivo passa do limite de 5 GB.";
const EMPTY_FILE_MESSAGE = "O arquivo enviado está vazio.";
const NO_FILE_MESSAGE = "Nenhum arquivo foi enviado.";
const UNSUPPORTED_FORMAT_MESSAGE = "Formato não suportado. Use MP4, MOV, MKV, WEBM ou AVI.";
const UNKNOWN_SIZE_MESSAGE = "Não foi possível saber o tamanho do arquivo. Tente enviar de novo.";
const UPLOAD_PLACEHOLDER_TITLE = "Vídeo enviado";

function resolveTitle(query: UploadQuery): string {
    if (query.title.length > 0) {
        return query.title;
    }

    const baseName = truncateText(path.parse(query.fileName).name.trim(), MAX_TITLE_LENGTH);

    if (baseName.length === 0) {
        return UPLOAD_PLACEHOLDER_TITLE;
    }

    return baseName;
}

interface ValidUpload {
    query: UploadQuery;
    extension: string;
    body: ReadableStream<Uint8Array>;
    /** Reserved against the quota before writing; the stream is cut there. */
    declaredBytes: number;
}

/**
 * The size the request declares, or null when it is missing or not a plain number. The browser
 * always sends it for a file; without it the space could not be reserved before writing.
 */
function readDeclaredBytes(request: Request): number | null {
    const header = request.headers.get("content-length");

    if (header === null) {
        return null;
    }

    const headerText = header.trim();

    if (DECIMAL_DIGITS_PATTERN.test(headerText) === false) {
        return null;
    }

    const declaredBytes = Number(headerText);

    if (Number.isSafeInteger(declaredBytes) === false) {
        return null;
    }

    return declaredBytes;
}

/** Turns a refused limit or quota into its response; anything else propagates. */
function toLimitResponse(error: unknown): Response {
    if (error instanceof TooManyVideosInProgressError) {
        return errorResponse(HTTP_TOO_MANY_REQUESTS, error.message);
    }

    if (error instanceof StorageQuotaExceededError) {
        return errorResponse(HTTP_PAYLOAD_TOO_LARGE, error.message);
    }

    throw error;
}

/**
 * Runs before the file is stored, so a refused upload never touches the disk. Returns the release
 * of the reserved space, or the response that refuses the upload.
 */
async function reserveSpaceOrRespond(
    userId: string,
    declaredBytes: number,
): Promise<(() => void) | Response> {
    try {
        return await reserveUploadSpace({ userId, declaredBytes });
    } catch (error) {
        return toLimitResponse(error);
    }
}

/** Returns the validated upload, or the error response to send back. */
function validateUpload(request: Request): ValidUpload | Response {
    const searchParams = new URL(request.url).searchParams;
    const queryResult = uploadQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (queryResult.success === false) {
        return errorResponse(HTTP_BAD_REQUEST, "Dados do envio inválidos.");
    }

    const query = queryResult.data;
    const extension = path.extname(query.fileName).toLowerCase();

    if (ALLOWED_VIDEO_EXTENSIONS.includes(extension) === false) {
        return errorResponse(HTTP_UNSUPPORTED_MEDIA_TYPE, UNSUPPORTED_FORMAT_MESSAGE);
    }

    const declaredBytes = readDeclaredBytes(request);

    if (declaredBytes === null) {
        return errorResponse(HTTP_LENGTH_REQUIRED, UNKNOWN_SIZE_MESSAGE);
    }

    if (declaredBytes > MAX_UPLOAD_BYTES) {
        return errorResponse(HTTP_PAYLOAD_TOO_LARGE, TOO_LARGE_MESSAGE);
    }

    if (declaredBytes === 0) {
        return errorResponse(HTTP_BAD_REQUEST, EMPTY_FILE_MESSAGE);
    }

    const body = request.body;

    if (body === null) {
        return errorResponse(HTTP_BAD_REQUEST, NO_FILE_MESSAGE);
    }

    return { query, extension, body, declaredBytes };
}

/** Turns the upload errors the user can fix into responses; anything else propagates. */
function toUploadErrorResponse(error: unknown): Response | null {
    if (error instanceof UploadTooLargeError) {
        return errorResponse(HTTP_PAYLOAD_TOO_LARGE, TOO_LARGE_MESSAGE);
    }

    if (error instanceof EmptyUploadError) {
        return errorResponse(HTTP_BAD_REQUEST, EMPTY_FILE_MESSAGE);
    }

    return null;
}

interface NewUploadedVideo {
    videoId: string;
    userId: string;
    stored: StoredUpload;
    query: UploadQuery;
}

/**
 * Checks the limits again under the user's start lock, then inserts the row and sends its job in
 * the same transaction. Without its row nothing would ever delete the file, so any failure (a
 * limit another request reached first included) removes it.
 */
async function insertUploadedVideo(video: NewUploadedVideo): Promise<Response | null> {
    const { videoId, userId, stored, query } = video;

    try {
        await runVideoStartTransaction(userId, async ({ transaction, jobDatabase }) => {
            await assertCanStartAnotherVideo(userId, transaction);
            await assertStorageAvailable(
                { userId, incomingBytes: stored.sourceBytes },
                transaction,
            );
            await transaction.insert(videos).values({
                id: videoId,
                userId,
                title: resolveTitle(query),
                source: "upload",
                sourcePath: stored.sourcePath,
                sourceBytes: stored.sourceBytes,
                requestedClipCount: query.clipCount,
                clipLength: query.clipLength,
                // "" is stored as is: it means "detect automatically", unlike null (videos from before 0002).
                transcriptionLanguage: query.language,
                processingStartedAt: new Date(),
            });
            await enqueueVideoProcessing({ videoId, userId }, jobDatabase);
        });
        return null;
    } catch (error) {
        await removeVideoDirectory(videoId);
        return toLimitResponse(error);
    }
}

/** Returns the stored file, or the error response to send back. */
async function storeUploadOrRespond(
    upload: ValidUpload,
    videoId: string,
): Promise<StoredUpload | Response> {
    try {
        return await storeVideoUpload(upload.body, {
            videoId,
            extension: upload.extension,
            maxBytes: upload.declaredBytes,
        });
    } catch (error) {
        const response = toUploadErrorResponse(error);

        if (response === null) {
            throw error;
        }

        return response;
    }
}

async function saveUploadedVideo(upload: ValidUpload, userId: string): Promise<Response> {
    const videoId = randomUUID();
    const stored = await storeUploadOrRespond(upload, videoId);

    if (stored instanceof Response) {
        return stored;
    }

    const limitResponse = await insertUploadedVideo({
        videoId,
        userId,
        stored,
        query: upload.query,
    });

    if (limitResponse !== null) {
        return limitResponse;
    }

    return Response.json({ videoId }, { status: HTTP_CREATED });
}

/** POST /api/videos/upload?fileName=&title=&clipCount=&clipLength=&language= with the raw file as the body. */
export async function handleVideoUpload(request: Request): Promise<Response> {
    const user = await getSessionUser(request.headers);

    if (user === null) {
        return errorResponse(HTTP_UNAUTHORIZED, "Entre na sua conta para enviar vídeos.");
    }

    const upload = validateUpload(request);

    if (upload instanceof Response) {
        return upload;
    }

    const releaseSpace = await reserveSpaceOrRespond(user.id, upload.declaredBytes);

    if (releaseSpace instanceof Response) {
        return releaseSpace;
    }

    try {
        return await saveUploadedVideo(upload, user.id);
    } finally {
        releaseSpace();
    }
}
