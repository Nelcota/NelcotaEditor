import { getRequestIP } from "@tanstack/react-start/server";
import { getEnvironment } from "#/shared/server/env.server";

/** Written by this server on every auth request; a value the client sends is replaced. */
const DIRECT_CLIENT_IP_HEADER = "x-nelcota-client-ip";

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

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

/** Auth bodies are small JSON, so buffering them avoids streaming a body into a new Request. */
async function readBody(request: Request): Promise<ArrayBuffer | null> {
    if (METHODS_WITHOUT_BODY.has(request.method) === true) {
        return null;
    }

    return request.arrayBuffer();
}

/** Copies the socket address into the request, because Better Auth only reads headers. */
export async function withDirectClientIp(request: Request): Promise<Request> {
    const proxyHeader = getEnvironment().TRUSTED_PROXY_IP_HEADER;

    if (proxyHeader !== undefined) {
        return request;
    }

    const headers = new Headers(request.headers);
    const clientIp = getRequestIP();
    headers.delete(DIRECT_CLIENT_IP_HEADER);

    if (clientIp !== undefined) {
        headers.set(DIRECT_CLIENT_IP_HEADER, clientIp);
    }

    // Built from parts: the server's own Request class cannot be passed to the Request constructor.
    return new Request(request.url, {
        method: request.method,
        headers,
        body: await readBody(request),
        signal: request.signal,
    });
}
