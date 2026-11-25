import { describe, expect, it, vi } from "vitest";
import { toPublicUrl } from "#/shared/server/public-url.server";

const readOrigin = vi.hoisted(() => vi.fn<() => string | undefined>());

vi.mock("#/shared/server/env.server", () => ({
    getEnvironment: () => ({ BETTER_AUTH_URL: readOrigin() }),
}));

describe("toPublicUrl", () => {
    it("keeps the asset path usable when development has no configured origin", () => {
        readOrigin.mockReturnValueOnce(undefined);

        expect(toPublicUrl("/og-image.png")).toBe("/og-image.png");
    });

    it("uses the configured origin for public previews", () => {
        readOrigin.mockReturnValueOnce("https://nelcota.example");

        expect(toPublicUrl("/og-image.png")).toBe("https://nelcota.example/og-image.png");
    });
});
