import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    NotFound,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import type { ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { contentTypeForKey } from "#/shared/server/file-storage/content-type-for-key";
import type {
    FileStorage,
    ServedFile,
    TransferOptions,
    UploadSlot,
} from "#/shared/server/file-storage/file-storage";

const CONNECTION_TIMEOUT_MILLISECONDS = 10_000;
// A socket with no bytes for this long is dead; long transfers that keep moving are not cut.
const SOCKET_IDLE_TIMEOUT_MILLISECONDS = 60_000;
const SMALL_REQUEST_TIMEOUT_MILLISECONDS = 30_000;
// A 5 GB source on a slow link; anything longer is stuck.
const TRANSFER_TIMEOUT_MILLISECONDS = 60 * 60 * 1000;
const HTTP_FOUND = 302;
const DOWNLOADED_FILE_PREFIX = "stored-";
const SPOOL_FOLDER_NAME = "spool";
const KEY_SEGMENT_SEPARATOR = "/";
const FORBIDDEN_KEY_SEGMENTS = new Set(["", ".", ".."]);
const SIGNED_UPLOAD_HEADERS = new Set(["content-length"]);

export interface R2Settings {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    /** Local folder where a stream of unknown length is written before its upload. */
    spoolDirectory: string;
}

export class InvalidStorageKeyError extends Error {
    constructor(key: string) {
        super(`Invalid storage key: ${key}`);
        this.name = "InvalidStorageKeyError";
    }
}

export class StoredFileUnreadableError extends Error {
    constructor(key: string) {
        super(`The store returned no body for ${key}`);
        this.name = "StoredFileUnreadableError";
    }
}

export class StoredFilesNotDeletedError extends Error {
    constructor(prefix: string, failedCount: number) {
        super(`${failedCount} file(s) under ${prefix} could not be deleted`);
        this.name = "StoredFilesNotDeletedError";
    }
}

/** Keys come from our own code, but a "..", an empty segment or a backslash means a bug. */
function assertValidKey(key: string): void {
    const segments = key.split(KEY_SEGMENT_SEPARATOR);

    if (key.includes("\\") || segments.some((segment) => FORBIDDEN_KEY_SEGMENTS.has(segment))) {
        throw new InvalidStorageKeyError(key);
    }
}

export function r2Endpoint(accountId: string): string {
    return `https://${accountId}.r2.cloudflarestorage.com`;
}

function createR2Client(settings: R2Settings): S3Client {
    return new S3Client({
        region: "auto",
        endpoint: r2Endpoint(settings.accountId),
        // Bucket in the path, not the host: signed links stay on the one origin the CSP allows.
        forcePathStyle: true,
        credentials: {
            accessKeyId: settings.accessKeyId,
            secretAccessKey: settings.secretAccessKey,
        },
        // R2 does not take every checksum newer SDKs add by default; send them only when required.
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
        requestHandler: {
            connectionTimeout: CONNECTION_TIMEOUT_MILLISECONDS,
            socketTimeout: SOCKET_IDLE_TIMEOUT_MILLISECONDS,
        },
    });
}

function smallRequestSignal(): { abortSignal: AbortSignal } {
    return { abortSignal: AbortSignal.timeout(SMALL_REQUEST_TIMEOUT_MILLISECONDS) };
}

/** The run's cancellation, when there is one, also stops the transfer before its own deadline. */
function transferSignal(options: TransferOptions): AbortSignal {
    const deadline = AbortSignal.timeout(TRANSFER_TIMEOUT_MILLISECONDS);
    const runSignal = options.signal;

    if (runSignal === undefined) {
        return deadline;
    }

    return AbortSignal.any([deadline, runSignal]);
}

function listedKeys(page: ListObjectsV2CommandOutput): Array<string> {
    const objects = page.Contents ?? [];

    return objects.flatMap((object) => {
        const key = object.Key;

        if (key === undefined) {
            return [];
        }

        return [key];
    });
}

/** Builds the adapter around one client, created once and shared by every request. */
export function createR2FileStorage(settings: R2Settings): FileStorage {
    const client = createR2Client(settings);
    const bucket = settings.bucket;

    async function storeLocalFile(
        key: string,
        localPath: string,
        options: TransferOptions = {},
    ): Promise<number> {
        assertValidKey(key);
        const fileStats = await stat(localPath);
        // R2 refuses a body without a length, so the size goes with it.
        await client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: createReadStream(localPath),
                ContentLength: fileStats.size,
                ContentType: contentTypeForKey(key),
            }),
            { abortSignal: transferSignal(options) },
        );
        return fileStats.size;
    }

    /**
     * Content-Length is signed, so R2 refuses a body of any other size: the browser cannot send
     * more than the space it reserved.
     */
    function createUploadUrl(key: string, slot: UploadSlot): Promise<string | null> {
        assertValidKey(key);

        return getSignedUrl(
            client,
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                ContentLength: slot.sizeBytes,
            }),
            { expiresIn: slot.lifetimeSeconds, signableHeaders: SIGNED_UPLOAD_HEADERS },
        );
    }

    /** The length of a stream is unknown until it ends, so it is written to disk first. */
    async function storeStream(key: string, stream: ReadableStream<Uint8Array>): Promise<number> {
        assertValidKey(key);
        const spoolDirectory = path.resolve(settings.spoolDirectory, SPOOL_FOLDER_NAME);
        const spoolPath = path.join(spoolDirectory, crypto.randomUUID());
        await mkdir(spoolDirectory, { recursive: true });

        try {
            await writeFile(spoolPath, stream);
            return await storeLocalFile(key, spoolPath);
        } finally {
            await rm(spoolPath, { force: true });
        }
    }

    async function getLocalFile(
        key: string,
        workDirectory: string,
        options: TransferOptions = {},
    ): Promise<string> {
        assertValidKey(key);
        const localPath = path.join(
            workDirectory,
            `${DOWNLOADED_FILE_PREFIX}${path.posix.basename(key)}`,
        );
        const abortSignal = transferSignal(options);
        const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }), {
            abortSignal,
        });
        const body = response.Body;

        if (body === undefined) {
            throw new StoredFileUnreadableError(key);
        }

        await writeFile(localPath, body.transformToWebStream(), { signal: abortSignal });
        return localPath;
    }

    async function measureFile(key: string): Promise<number> {
        assertValidKey(key);

        try {
            const head = await client.send(
                new HeadObjectCommand({ Bucket: bucket, Key: key }),
                smallRequestSignal(),
            );
            return head.ContentLength ?? 0;
        } catch (error) {
            if (error instanceof NotFound) {
                return 0;
            }

            throw error;
        }
    }

    async function deleteFile(key: string): Promise<void> {
        assertValidKey(key);
        await client.send(
            new DeleteObjectCommand({ Bucket: bucket, Key: key }),
            smallRequestSignal(),
        );
    }

    async function deleteKeys(prefix: string, keys: Array<string>): Promise<void> {
        if (keys.length === 0) {
            return;
        }

        const result = await client.send(
            new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: keys.map((key) => ({ Key: key })), Quiet: true },
            }),
            smallRequestSignal(),
        );
        const errors = result.Errors ?? [];

        if (errors.length > 0) {
            throw new StoredFilesNotDeletedError(prefix, errors.length);
        }
    }

    /** One page at a time: a page holds at most 1000 keys, as many as one batch delete takes. */
    async function deleteFolder(prefix: string): Promise<void> {
        assertValidKey(prefix);
        let continuationToken: string | undefined;

        do {
            const page: ListObjectsV2CommandOutput = await client.send(
                new ListObjectsV2Command({
                    Bucket: bucket,
                    Prefix: `${prefix}${KEY_SEGMENT_SEPARATOR}`,
                    ContinuationToken: continuationToken,
                }),
                smallRequestSignal(),
            );
            await deleteKeys(prefix, listedKeys(page));
            continuationToken = page.NextContinuationToken;
        } while (continuationToken !== undefined);
    }

    /**
     * The browser fetches the bytes from R2 itself, so they never pass through the app (or the
     * Cloudflare proxy in front of it). Signing happens locally; no request is made here.
     */
    async function respondWithFile(_request: Request, file: ServedFile): Promise<Response> {
        const key = file.key;
        assertValidKey(key);
        const headers = file.headers;
        const signedUrl = await getSignedUrl(
            client,
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
                ResponseContentType: headers.get("Content-Type") ?? undefined,
                ResponseContentDisposition: headers.get("Content-Disposition") ?? undefined,
            }),
            { expiresIn: file.linkLifetimeSeconds },
        );

        return new Response(null, {
            status: HTTP_FOUND,
            // Each request gets a fresh link; a cached redirect would outlive it.
            headers: { Location: signedUrl, "Cache-Control": "private, no-store" },
        });
    }

    return {
        storeLocalFile,
        createUploadUrl,
        storeStream,
        getLocalFile,
        measureFile,
        deleteFile,
        deleteFolder,
        respondWithFile,
    };
}
