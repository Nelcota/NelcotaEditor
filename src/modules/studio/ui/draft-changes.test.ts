import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CaptionCue, StudioDraft } from "#/modules/clips/clip-studio.schema";
import { countDraftChanges } from "#/modules/studio/ui/draft-changes";

function appliedDraft(cues: Array<CaptionCue>): StudioDraft {
    return {
        startSeconds: 10,
        endSeconds: 40,
        aspectRatio: "vertical",
        captionStyle: "karaoke",
        captionColor: "yellow",
        captionSize: "medium",
        captionPosition: "bottom",
        captionFont: "montserrat",
        cues,
    };
}

// Postgres jsonb stores keys shortest first, so the transcript's words come back in this order.
const TRANSCRIPT_CUES: Array<CaptionCue> = [
    {
        words: [
            { text: "Oi", endSeconds: 10.4, startSeconds: 10 },
            { text: "gente", endSeconds: 10.9, startSeconds: 10.5 },
        ],
        endSeconds: 10.9,
        startSeconds: 10,
    },
    {
        words: [{ text: "tudo", endSeconds: 11.6, startSeconds: 11 }],
        endSeconds: 11.6,
        startSeconds: 11,
    },
];

// The saved draft comes back through Zod, which rebuilds each object in the schema's key order.
const RELOADED_FIRST_CUE: CaptionCue = {
    startSeconds: 10,
    endSeconds: 10.9,
    words: [
        { text: "Oi", startSeconds: 10, endSeconds: 10.4 },
        { text: "gente", startSeconds: 10.5, endSeconds: 10.9 },
    ],
};

const RELOADED_SECOND_CUE: CaptionCue = {
    startSeconds: 11,
    endSeconds: 11.6,
    words: [{ text: "tudo", startSeconds: 11, endSeconds: 11.6 }],
};

describe("countDraftChanges", () => {
    it("counts only the colour after a reload reorders the caption keys", () => {
        const applied = appliedDraft(TRANSCRIPT_CUES);
        const reloaded = appliedDraft([RELOADED_FIRST_CUE, RELOADED_SECOND_CUE]);
        const draft: StudioDraft = { ...reloaded, captionColor: "green" };

        const changes = countDraftChanges(draft, applied);

        assert.equal(changes, 1);
    });

    it("counts a caption whose text changed", () => {
        const applied = appliedDraft(TRANSCRIPT_CUES);
        const editedWords = [{ text: "bem", startSeconds: 11, endSeconds: 11.6 }];
        const editedCue: CaptionCue = { ...RELOADED_SECOND_CUE, words: editedWords };
        const draft = appliedDraft([RELOADED_FIRST_CUE, editedCue]);

        const changes = countDraftChanges(draft, applied);

        assert.equal(changes, 1);
    });
});
