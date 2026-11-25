import { expect, test } from "@playwright/test";

const HTTP_OK = 200;

test("answers the health check with only the status and no caching", async ({ request }) => {
    const response = await request.get("/health");

    expect(response.status()).toBe(HTTP_OK);
    expect(await response.json()).toStrictEqual({ status: "ok" });
    expect(response.headers()["cache-control"]).toBe("no-store");
});
