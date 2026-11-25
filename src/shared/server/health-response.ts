import { HTTP_OK, HTTP_SERVICE_UNAVAILABLE } from "#/shared/server/http-response";

export type HealthStatus = "ok" | "unavailable";

const STATUS_CODES: Readonly<Record<HealthStatus, number>> = {
    ok: HTTP_OK,
    unavailable: HTTP_SERVICE_UNAVAILABLE,
};

/** Only the status: versions, hosts or database errors would tell an attacker what runs here. */
export function toHealthResponse(status: HealthStatus): Response {
    return Response.json(
        { status },
        { status: STATUS_CODES[status], headers: { "Cache-Control": "no-store" } },
    );
}
