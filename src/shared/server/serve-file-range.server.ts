import { stat } from "node:fs/promises";
import { parseByteRange } from "#/shared/server/byte-range.server";
import type { ByteRange } from "#/shared/server/byte-range.server";
import { createFileStream } from "#/shared/server/file-stream.server";

const HTTP_PARTIAL_CONTENT = 206;
const HTTP_RANGE_NOT_SATISFIABLE = 416;

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

async function readFileSize(absolutePath: string): Promise<number> {
    const stats = await stat(absolutePath);

    if (stats.isFile() === false) {
        throw new NotAFileError(absolutePath);
    }

    return stats.size;
}

/**
 * Streams a file, honouring the Range header so video players can seek. The caller has already
 * checked who may read the file and resolved its path inside the storage directory.
 */
export async function respondWithFileRange(
    request: Request,
    absolutePath: string,
    headers: Headers,
): Promise<Response> {
    const fileSize = await readFileSize(absolutePath);
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
