import { describe, expect, it } from "vitest";
import type { SharedClip } from "#/modules/clips/model/shared-clip";
import { buildSharedClipHead } from "#/modules/clips/model/shared-clip-head";

const SHARED_CLIP: SharedClip = {
    title: "O melhor momento",
    aspectRatio: "vertical",
    durationSeconds: 42,
    videoPath: "/api/share/token",
    pageUrl: "https://nelcota.example/c/token",
    videoUrl: "https://nelcota.example/api/share/token",
    posterUrl: "https://nelcota.example/api/share/token/poster",
};

function findContent(head: ReturnType<typeof buildSharedClipHead>, key: string): unknown {
    const tag = head.find(
        (meta) =>
            ("property" in meta && meta.property === key) || ("name" in meta && meta.name === key),
    );

    if (tag === undefined || "title" in tag) {
        return undefined;
    }

    return tag.content;
}

describe("buildSharedClipHead", () => {
    it("previews the link with the clip's title, video and poster", () => {
        const head = buildSharedClipHead(SHARED_CLIP);

        expect(findContent(head, "og:title")).toBe("O melhor momento");
        expect(findContent(head, "og:video")).toBe(SHARED_CLIP.videoUrl);
        expect(findContent(head, "og:image")).toBe(SHARED_CLIP.posterUrl);
        expect(findContent(head, "og:image:height")).toBe("1280");
    });

    it("leaves the app's image in place when the clip has no poster", () => {
        const head = buildSharedClipHead({ ...SHARED_CLIP, posterUrl: null });

        expect(findContent(head, "og:image")).toBeUndefined();
    });

    it("keeps the secret link out of search engines", () => {
        const head = buildSharedClipHead(SHARED_CLIP);

        expect(findContent(head, "robots")).toBe("noindex");
    });
});
