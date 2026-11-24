import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { SECURITY_HEADERS, withNoStoreByDefault } from "#/shared/server/security-headers";

describe("withNoStoreByDefault", () => {
    it("marks a response without a cache policy as private and not stored", async () => {
        const response = withNoStoreByDefault(new Response("<html></html>", { status: 200 }));

        assert.equal(response.headers.get("Cache-Control"), "private, no-store");
        assert.equal(response.status, 200);
        assert.equal(await response.text(), "<html></html>");
    });

    it("keeps the cache policy a file route already chose", () => {
        const original = new Response(null, { headers: { "Cache-Control": "public, max-age=60" } });

        const response = withNoStoreByDefault(original);

        assert.equal(response.headers.get("Cache-Control"), "public, max-age=60");
    });
});

describe("SECURITY_HEADERS", () => {
    it("tells browsers to use HTTPS only", () => {
        const names = SECURITY_HEADERS.map(([name]) => name);

        assert.equal(names.includes("Strict-Transport-Security"), true);
    });
});

describe("Permissions-Policy", () => {
    const policy = new Map<string, string>(SECURITY_HEADERS).get("Permissions-Policy") ?? "";
    const directives = policy.split(",").map((directive) => directive.trim());

    it("turns off device and payment features the app never uses", () => {
        for (const feature of ["camera", "microphone", "geolocation", "payment", "usb"]) {
            assert.equal(directives.includes(`${feature}=()`), true, feature);
        }
    });

    it("leaves fullscreen and the clipboard to the app's own pages", () => {
        for (const feature of ["fullscreen", "clipboard-write"]) {
            assert.equal(directives.includes(`${feature}=()`), false, feature);
        }
    });
});
