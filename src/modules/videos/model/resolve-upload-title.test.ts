import { describe, expect, it } from "vitest";
import { MAX_TITLE_LENGTH } from "#/modules/video-records/model/upload-limits";
import { resolveUploadTitle } from "#/modules/videos/model/resolve-upload-title";

describe("resolveUploadTitle", () => {
    it("keeps the typed title", () => {
        expect(resolveUploadTitle("gravação.mp4", "  Entrevista  ")).toBe("Entrevista");
    });

    it("drops the extension from the file name", () => {
        expect(resolveUploadTitle("aula.parte.1.mp4", "")).toBe("aula.parte.1");
    });

    it("drops any folder from the file name", () => {
        expect(resolveUploadTitle("C:\\Vídeos\\aula.mov", "")).toBe("aula");
    });

    it("cuts a long file name to the title limit", () => {
        const longName = `${"a".repeat(MAX_TITLE_LENGTH + 10)}.mp4`;

        expect(resolveUploadTitle(longName, "")).toBe("a".repeat(MAX_TITLE_LENGTH));
    });

    it("falls back to a placeholder when the name is only an extension", () => {
        expect(resolveUploadTitle(" .mp4", "")).toBe("Vídeo enviado");
    });
});
