export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_PARTIAL_CONTENT = 206;
export const HTTP_NOT_MODIFIED = 304;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_PAYMENT_REQUIRED = 402;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_PAYLOAD_TOO_LARGE = 413;
export const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
export const HTTP_RANGE_NOT_SATISFIABLE = 416;
export const HTTP_TOO_MANY_REQUESTS = 429;
export const HTTP_INTERNAL_SERVER_ERROR = 500;
export const HTTP_SERVICE_UNAVAILABLE = 503;

/** The JSON shape the browser reads on a failed API route: `{ error: message }`. */
export function errorResponse(status: number, message: string): Response {
    return Response.json({ error: message }, { status });
}
