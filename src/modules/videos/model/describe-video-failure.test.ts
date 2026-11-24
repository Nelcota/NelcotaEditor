import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { describeVideoFailure } from "#/modules/videos/model/describe-video-failure";

const STORED_ERROR = "O vídeo é privado.";
const RETRY_ERROR = "Não deu para retomar agora.";

describe("describeVideoFailure", () => {
    it("prefers the failed retry over the stored error", () => {
        const message = describeVideoFailure({ errorMessage: STORED_ERROR }, RETRY_ERROR);

        assert.equal(message, RETRY_ERROR);
    });

    it("falls back to the stored error when the retry did not fail", () => {
        const message = describeVideoFailure({ errorMessage: STORED_ERROR }, null);

        assert.equal(message, STORED_ERROR);
    });

    it("skips blank messages instead of showing an empty line", () => {
        const message = describeVideoFailure({ errorMessage: "   " }, "");

        assert.equal(message.trim().length > 0, true);
        assert.notEqual(message, "   ");
    });

    it("uses the generic line when nothing was recorded", () => {
        const message = describeVideoFailure({ errorMessage: null }, null);

        assert.equal(message.length > 0, true);
    });
});
