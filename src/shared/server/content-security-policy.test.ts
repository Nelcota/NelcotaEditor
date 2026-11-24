import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "#/shared/server/content-security-policy";

const R2_ORIGIN = "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com";

function findDirective(policy: string, name: string): string {
    const directive = policy.split("; ").find((candidate) => candidate.startsWith(`${name} `));

    return directive ?? "";
}

describe("buildContentSecurityPolicy", () => {
    it("lets media, images and uploads reach the storage origin when files live in R2", () => {
        const policy = buildContentSecurityPolicy({
            nonce: "abc",
            isDevelopment: false,
            storageMediaOrigin: R2_ORIGIN,
        });

        expect(findDirective(policy, "media-src")).toContain(R2_ORIGIN);
        expect(findDirective(policy, "img-src")).toContain(R2_ORIGIN);
        expect(findDirective(policy, "connect-src")).toContain(R2_ORIGIN);
    });

    it("keeps media on the app's own origin when files live on its disk", () => {
        const policy = buildContentSecurityPolicy({
            nonce: "abc",
            isDevelopment: false,
            storageMediaOrigin: null,
        });

        expect(findDirective(policy, "media-src")).toBe("media-src 'self' blob:");
    });
});
