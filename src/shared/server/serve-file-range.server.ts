import { stat } from "node:fs/promises";
import { parseByteRange } from "#/shared/server/byte-range.server";
import type { ByteRange } from "#/shared/server/byte-range.server";
import { createFileStream } from "#/shared/server/file-stream.server";
import { isFileNotFoundError } from "#/shared/server/fs-errors";
import {
    HTTP_NOT_FOUND,
    HTTP_NOT_MODIFIED,
    HTTP_PARTIAL_CONTENT,
    HTTP_RANGE_NOT_SATISFIABLE,
} from "#/shared/server/http-response";

const MILLISECONDS = 1000;

interface FileOnDisk {
    absolutePath: string;
    fileSize: number;
}

export class NotAFileError extends Error {
    constructor(absolutePath: string) {
        super(`Expected a regular file at ${absolutePath}`);
        this.name = "NotAFileError";
    }
}

function partialResponse(file: FileOnDisk, range: ByteRange, headers: Headers): Response {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${file.fileSize}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
    return new Response(createFileStream(file.absolutePath, range.start, range.end), {
        status: HTTP_PARTIAL_CONTENT,
        headers,
    });
}

interface FileFacts {
    size: number;
    /** Whole seconds: HTTP dates carry no milliseconds. */
    modifiedSeconds: number;
}

/** null when the file is gone: the row can outlive it (a delete racing the request, a manual cleanup). */
async function readFileFacts(absolutePath: string): Promise<FileFacts | null> {
    try {
        const stats = await stat(absolutePath);

        if (stats.isFile() === false) {
            throw new NotAFileError(absolutePath);
        }

        return { size: stats.size, modifiedSeconds: Math.floor(stats.mtimeMs / MILLISECONDS) };
    } catch (error) {
        if (isFileNotFoundError(error) === true) {
            return null;
        }

        throw error;
    }
}

/** True when the browser's copy is as new as the file, so a 304 saves sending it again. */
function isUnmodifiedSince(request: Request, modifiedSeconds: number): boolean {
    const since = request.headers.get("if-modified-since");

    if (since === null) {
        return false;
    }

    const sinceMilliseconds = Date.parse(since);

    if (Number.isFinite(sinceMilliseconds) === false) {
        return false;
    }

    return modifiedSeconds <= Math.floor(sinceMilliseconds / MILLISECONDS);
}

/**
 * Streams a file, honouring the Range header so video players can seek. The caller has already
 * checked who may read the file and resolved its path inside the storage directory.
 * Last-Modified lets a file rewritten in place (a re-rendered clip) be revalidated cheaply.
 */
export async function respondWithFileRange(
    request: Request,
    absolutePath: string,
    headers: Headers,
): Promise<Response> {
    const facts = await readFileFacts(absolutePath);

    if (facts === null) {
        return new Response(null, { status: HTTP_NOT_FOUND, headers });
    }

    const fileSize = facts.size;
    headers.set("Last-Modified", new Date(facts.modifiedSeconds * MILLISECONDS).toUTCString());

    if (isUnmodifiedSince(request, facts.modifiedSeconds) === true) {
        return new Response(null, { status: HTTP_NOT_MODIFIED, headers });
    }

    const range = parseByteRange(request.headers.get("range"), fileSize);

    headers.set("Accept-Ranges", "bytes");

    if (range === null) {
        headers.set("Content-Range", `bytes */${fileSize}`);
        return new Response(null, { status: HTTP_RANGE_NOT_SATISFIABLE, headers });
    }

    if (range !== undefined) {
        return partialResponse({ absolutePath, fileSize }, range, headers);
    }

    headers.set("Content-Length", String(fileSize));
    return new Response(createFileStream(absolutePath, 0, fileSize - 1), { headers });
}
