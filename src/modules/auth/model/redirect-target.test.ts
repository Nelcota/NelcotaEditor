import { describe, expect, it } from "vitest";
import { toRedirectTarget } from "#/modules/auth/model/redirect-target";
import { signInSearchSchema } from "#/modules/auth/model/sign-in-search";

function parseTarget(redirect: unknown): string {
    return toRedirectTarget(signInSearchSchema.parse({ redirect }));
}

describe("sign-in redirect target", () => {
    it("goes back to the page that asked for the sign-in", () => {
        expect(parseTarget("/videos/abc?tab=clips#top")).toBe("/videos/abc?tab=clips#top");
    });

    it("goes home without a redirect", () => {
        expect(parseTarget(undefined)).toBe("/");
    });

    const unsafeTargets = [
        "https://evil.example/",
        "//evil.example/",
        "/\\evil.example/",
        "\\\\evil.example/",
        "javascript:alert(1)",
        "/\t/evil.example/",
        "/\n/evil.example/",
        "videos/abc",
        "",
    ];

    for (const target of unsafeTargets) {
        it(`goes home instead of ${JSON.stringify(target)}`, () => {
            expect(parseTarget(target)).toBe("/");
        });
    }

    it("goes home when the redirect is not text", () => {
        expect(parseTarget(42)).toBe("/");
    });
});
