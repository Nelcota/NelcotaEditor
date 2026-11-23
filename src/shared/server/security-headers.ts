/**
 * No other site may frame the app (clickjacking on the delete and cancel buttons), URLs with ids
 * do not leak to other origins, and once a browser has seen the app over HTTPS it never falls back
 * to plain HTTP (browsers ignore HSTS on http://localhost). The Content-Security-Policy is set per
 * request (its nonce).
 */
export const SECURITY_HEADERS = [
    ["X-Frame-Options", "DENY"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["X-Content-Type-Options", "nosniff"],
    ["Strict-Transport-Security", "max-age=31536000; includeSubDomains"],
] as const;

const CACHE_CONTROL_HEADER = "Cache-Control";
const PRIVATE_NO_STORE = "private, no-store";

/**
 * Pages and server function results belong to the signed-in user, so no shared cache (a CDN rule
 * that "caches everything") may keep them. Routes that serve files set their own policy, which wins.
 */
export function withNoStoreByDefault(response: Response): Response {
    const headers = response.headers;

    if (headers.has(CACHE_CONTROL_HEADER) === true) {
        return response;
    }

    const updatedHeaders = new Headers(headers);
    updatedHeaders.set(CACHE_CONTROL_HEADER, PRIVATE_NO_STORE);
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: updatedHeaders,
    });
}
