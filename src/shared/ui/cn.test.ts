import { describe, expect, it } from "vitest";
import { cn } from "#/shared/ui/cn";

describe("cn", () => {
    it("lets a theme text size replace a default one", () => {
        expect(cn("text-xl font-semibold", "text-title font-extrabold")).toBe(
            "text-title font-extrabold",
        );
    });

    it("keeps a theme text size beside a text colour", () => {
        expect(cn("text-meta", "text-muted-foreground")).toBe("text-meta text-muted-foreground");
    });

    it("lets theme tracking replace default tracking", () => {
        expect(cn("tracking-tight", "tracking-display")).toBe("tracking-display");
    });
});
