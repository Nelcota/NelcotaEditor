import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { buildHighlightSystemPrompt } from "#/modules/highlights/model/highlight-prompt";

describe("buildHighlightSystemPrompt", () => {
    it("keeps the free range and lets the clip run long for the payoff", () => {
        const prompt = buildHighlightSystemPrompt(5, "free");

        assert.match(prompt, /Between 20 and 60 seconds long, never more than 90\./);
        assert.match(prompt, /Going a bit longer to include the payoff/);
    });

    it("asks for 55 to 65 s close to 60 s, ending a sentence, for 1 minuto", () => {
        const prompt = buildHighlightSystemPrompt(5, "minute");

        assert.match(prompt, /Between 55 and 65 seconds long, aiming close to 60 seconds/);
        assert.match(prompt, /End at the end of a sentence/);
        assert.doesNotMatch(prompt, /Going a bit longer/);
    });

    it("asks for 20 to 40 s for Curtos", () => {
        const prompt = buildHighlightSystemPrompt(5, "short");

        assert.match(prompt, /Between 20 and 40 seconds long, never more than 40\./);
        assert.doesNotMatch(prompt, /Going a bit longer/);
    });

    it("asks for three extra candidates", () => {
        assert.match(buildHighlightSystemPrompt(5, "minute"), /Pick up to 8 of the best moments/);
    });

    it("throws for a count that is not a positive integer", () => {
        for (const clipCount of [0, -1, 1.5, Number.NaN]) {
            assert.throws(() => buildHighlightSystemPrompt(clipCount, "free"), RangeError);
        }
    });
});
