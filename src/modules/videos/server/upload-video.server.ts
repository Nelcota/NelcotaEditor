import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { db } from "#/db/database.server";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { TRANSCRIPTION_LANGUAGES } from "#/modules/preferences/preferences";
import { enqueueVideoProcessing } from "#/modules/processing/server/video-processing-queue.server";
import {
    EmptyUploadError,
    UploadTooLargeError,
    removeVideoDirectory,
    storeVideoUpload,
} from "#/modules/videos/server/store-video-upload.server";
import {
    ALLOWED_VIDEO_EXTENSIONS,
    MAX_TITLE_LENGTH,
    MAX_UPLOAD_BYTES,
} from "#/modules/videos/upload-limits";
import { MAX_CLIP_COUNT, MIN_CLIP_COUNT } from "#/modules/videos/video-status";
import { videos } from "#/modules/videos/videos.schema";
import { truncateText } from "#/modules/videos/video-title";

const MAX_FILE_NAME_LENGTH = 255;
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;

const uploadQuerySchema = z.object({
    fileName: z.string().trim().min(1).max(MAX_FILE_NAME_LENGTH),
    title: z.string().trim().max(MAX_TITLE_LENGTH).default(""),
    clipCount: z.coerce.number().int().min(MIN_CLIP_COUNT).max(MAX_CLIP_COUNT),
    language: z.enum(TRANSCRIPTION_LANGUAGES),
});

type UploadQuery = z.infer<typeof uploadQuerySchema>;

const TOO_LARGE_MESSAGE = "O arquivo passa do limite de 5 GB.";
const EMPTY_FILE_MESSAGE = "O arquivo enviado está vazio.";
const NO_FILE_MESSAGE = "Nenhum arquivo foi enviado.";
const UNSUPPORTED_FORMAT_MESSAGE = "Formato não suportado. Use MP4, MOV, MKV, WEBM ou AVI.";
const UPLOAD_PLACEHOLDER_TITLE = "Vídeo enviado";

function errorResponse(status: number, message: string): Response {
    return Response.json({ error: message }, { status });
}

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
}

/** A missing or unparsable Content-Length is fine: the stream is still capped while writing. */
function isDeclaredTooLarge(request: Request): boolean {
    const declaredLength = Number(request.headers.get("content-length"));

    return Number.isFinite(declaredLength) === true && declaredLength > MAX_UPLOAD_BYTES;
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

    if (isDeclaredTooLarge(request) === true) {
        return errorResponse(HTTP_PAYLOAD_TOO_LARGE, TOO_LARGE_MESSAGE);
    }

    const body = request.body;

    if (body === null) {
        return errorResponse(HTTP_BAD_REQUEST, NO_FILE_MESSAGE);
    }

    return { query, extension, body };
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
    sourcePath: string;
    query: UploadQuery;
}

/** Without its row nothing would ever delete the file, so a failed insert removes it. */
async function insertUploadedVideo(video: NewUploadedVideo): Promise<void> {
    const { videoId, userId, sourcePath, query } = video;

    try {
        await db.insert(videos).values({
            id: videoId,
            userId,
            title: resolveTitle(query),
            source: "upload",
            sourcePath,
            requestedClipCount: query.clipCount,
            // "" is stored as is: it means "detect automatically", unlike null (videos from before 0002).
            transcriptionLanguage: query.language,
            processingStartedAt: new Date(),
        });
    } catch (error) {
        await removeVideoDirectory(videoId);
        throw error;
    }
}

/** Returns the stored source path, or the error response to send back. */
async function storeUploadOrRespond(
    upload: ValidUpload,
    videoId: string,
): Promise<string | Response> {
    try {
        return await storeVideoUpload(upload.body, { videoId, extension: upload.extension });
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
    const sourcePath = await storeUploadOrRespond(upload, videoId);

    if (sourcePath instanceof Response) {
        return sourcePath;
    }

    await insertUploadedVideo({ videoId, userId, sourcePath, query: upload.query });
    await enqueueVideoProcessing(videoId);
    return Response.json({ videoId }, { status: HTTP_CREATED });
}

/** POST /api/videos/upload?fileName=&title=&clipCount= with the raw file as the body. */
export async function handleVideoUpload(request: Request): Promise<Response> {
    const user = await getSessionUser(request.headers);

    if (user === null) {
        return errorResponse(HTTP_UNAUTHORIZED, "Entre na sua conta para enviar vídeos.");
    }

    const upload = validateUpload(request);

    if (upload instanceof Response) {
        return upload;
    }

    return saveUploadedVideo(upload, user.id);
}
