import { getRequestIP } from "@tanstack/react-start/server";
import { getEnvironment } from "#/shared/server/env.server";

/** Written by this server on every auth request; a value the client sends is replaced. */
const DIRECT_CLIENT_IP_HEADER = "x-nelcota-client-ip";

/** Auth requests carry a small JSON form; anything near this size is not a real person. */
export const MAX_AUTH_BODY_BYTES = 64 * 1024;

export class AuthBodyTooLargeError extends Error {
    constructor() {
        super(`Auth request body is larger than ${MAX_AUTH_BODY_BYTES} bytes`);
        this.name = "AuthBodyTooLargeError";
    }
}

/**
 * Where Better Auth reads the client IP for rate limits. Behind a proxy, only the header that
 * proxy sets; otherwise only the header this server writes, since any other one could be forged.
 */
export function getClientIpHeaders(): Array<string> {
    const proxyHeader = getEnvironment().TRUSTED_PROXY_IP_HEADER;

    if (proxyHeader !== undefined) {
        return [proxyHeader];
    }

    return [DIRECT_CLIENT_IP_HEADER];
}

/** The address the rate limiter keys on, read from a request prepareAuthRequest returned. */
export function readClientIp(request: Request): string | null {
    const [header] = getClientIpHeaders();

    if (header === undefined) {
        return null;
    }

    return request.headers.get(header);
}

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

function assertDeclaredLengthFits(request: Request): void {
    const declaredLength = Number(request.headers.get("content-length"));

    if (Number.isFinite(declaredLength) === true && declaredLength > MAX_AUTH_BODY_BYTES) {
        throw new AuthBodyTooLargeError();
    }
}

function joinChunks(chunks: Array<Uint8Array>, totalBytes: number): Uint8Array<ArrayBuffer> {
    const joined = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
        joined.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return joined;
}

/**
 * Read before Better Auth's rate limit runs, so the size is capped here: stops as soon as the body
 * passes the limit, whatever Content-Length claimed.
 */
async function readLimitedBody(request: Request): Promise<Uint8Array<ArrayBuffer> | null> {
    if (METHODS_WITHOUT_BODY.has(request.method) === true) {
        return null;
    }

    // Checked before touching request.body: opening the stream and leaving it unread resets the
    // connection, which breaks the next request sent on it.
    assertDeclaredLengthFits(request);
    const body = request.body;

    if (body === null) {
        return null;
    }

    const reader = body.getReader();
    const chunks: Array<Uint8Array> = [];
    let totalBytes = 0;

    for (let chunk = await reader.read(); chunk.done === false; chunk = await reader.read()) {
        totalBytes += chunk.value.byteLength;

        if (totalBytes > MAX_AUTH_BODY_BYTES) {
            await reader.cancel();
            throw new AuthBodyTooLargeError();
        }

        chunks.push(chunk.value);
    }

    return joinChunks(chunks, totalBytes);
}

/** Copies the socket address into the headers, because Better Auth only reads headers. */
function buildAuthHeaders(request: Request): Headers {
    const headers = new Headers(request.headers);

    if (getEnvironment().TRUSTED_PROXY_IP_HEADER !== undefined) {
        return headers;
    }

    const clientIp = getRequestIP();
    headers.delete(DIRECT_CLIENT_IP_HEADER);

    if (clientIp !== undefined) {
        headers.set(DIRECT_CLIENT_IP_HEADER, clientIp);
    }

    return headers;
}

/**
 * The request Better Auth receives: the client IP it rate limits on, and a body of bounded size.
 *
 * @throws {AuthBodyTooLargeError} When the body is larger than MAX_AUTH_BODY_BYTES.
 */
export async function prepareAuthRequest(request: Request): Promise<Request> {
    const body = await readLimitedBody(request);

    // Built from parts: the server's own Request class cannot be passed to the Request constructor.
    return new Request(request.url, {
        method: request.method,
        headers: buildAuthHeaders(request),
        body,
        signal: request.signal,
    });
}
