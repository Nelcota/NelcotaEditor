import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupWordsIntoCues } from "#/modules/clips/model/caption-cues";
import type { CaptionWord, StudioDraft } from "#/modules/clips/model/clip-studio";
import {
    canUndoReset,
    hasCaptionsToReset,
    isCueChangedFromOriginal,
    resetCaptions,
} from "#/modules/studio/model/caption-reset";
import { editCueText, replaceCueAt } from "#/modules/studio/model/cue-editing";

function word(text: string, startSeconds: number, endSeconds: number): CaptionWord {
    return { text, startSeconds, endSeconds };
}

const WORDS = [
    word("Oi,", 0, 0.4),
    word("tudo", 0.5, 0.9),
    word("bem?", 1, 1.4),
    word("Sim.", 2, 2.4),
];

function transcriptDraft(): StudioDraft {
    return {
        startSeconds: 0,
        endSeconds: 20,
        aspectRatio: "vertical",
        captionStyle: "karaoke",
        captionColor: "yellow",
        captionSize: "medium",
        captionPosition: "bottom",
        captionFont: "montserrat",
        cues: groupWordsIntoCues(WORDS),
    };
}

function editFirstCue(draft: StudioDraft): StudioDraft {
    const firstCue = draft.cues[0];

    if (firstCue === undefined) {
        throw new Error("the fixture has no first cue");
    }

    const edited = editCueText(firstCue, "Olá, tudo bem?");

    if (edited === null) {
        throw new Error("the fixture edit removed the cue");
    }

    return replaceCueAt(draft, 0, [edited]);
}

describe("hasCaptionsToReset", () => {
    it("is false for captions straight from the transcript", () => {
        assert.equal(hasCaptionsToReset(transcriptDraft(), WORDS), false);
    });

    it("is true once a caption was edited", () => {
        assert.equal(hasCaptionsToReset(editFirstCue(transcriptDraft()), WORDS), true);
    });
});

describe("isCueChangedFromOriginal", () => {
    it("is false for an untouched cue whose keys came back from the database in another order", () => {
        const untouched = transcriptDraft().cues[0];

        assert.ok(untouched !== undefined);
        const fromDatabase = {
            words: untouched.words.map((item) => ({
                text: item.text,
                endSeconds: item.endSeconds,
                startSeconds: item.startSeconds,
            })),
            endSeconds: untouched.endSeconds,
            startSeconds: untouched.startSeconds,
        };

        assert.equal(isCueChangedFromOriginal(fromDatabase, WORDS), false);
    });

    it("is false for an untouched cue and true for an edited one", () => {
        const untouched = transcriptDraft().cues[0];
        const edited = editFirstCue(transcriptDraft()).cues[0];

        assert.ok(untouched !== undefined && edited !== undefined);
        assert.equal(isCueChangedFromOriginal(untouched, WORDS), false);
        assert.equal(isCueChangedFromOriginal(edited, WORDS), true);
    });
});

describe("resetCaptions", () => {
    it("brings one cue back to what was heard", () => {
        const edited = editFirstCue(transcriptDraft());

        const reset = resetCaptions(edited, WORDS, { scope: "cue", index: 0 });

        assert.deepEqual(reset.cues, transcriptDraft().cues);
    });

    it("leaves the draft alone for a cue that no longer exists", () => {
        const draft = transcriptDraft();

        assert.equal(resetCaptions(draft, WORDS, { scope: "cue", index: 9 }), draft);
    });
});

describe("canUndoReset", () => {
    it("offers undo right after the reset", () => {
        const before = editFirstCue(transcriptDraft());
        const after = resetCaptions(before, WORDS, { scope: "all" });

        assert.equal(canUndoReset(after, { before, reset: { scope: "all" } }, WORDS), true);
    });

    it("stops offering undo once something else changed", () => {
        const before = editFirstCue(transcriptDraft());
        const after = resetCaptions(before, WORDS, { scope: "all" });
        const laterEdit: StudioDraft = { ...after, captionColor: "green" };

        assert.equal(canUndoReset(laterEdit, { before, reset: { scope: "all" } }, WORDS), false);
    });

    it("stops offering undo once the edits are back", () => {
        const before = editFirstCue(transcriptDraft());

        assert.equal(canUndoReset(before, { before, reset: { scope: "all" } }, WORDS), false);
    });
});
