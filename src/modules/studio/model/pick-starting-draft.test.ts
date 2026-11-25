import { describe, expect, it } from "vitest";
import type { StudioDraft } from "#/modules/clips/model/clip-studio";
import { pickStartingDraft } from "#/modules/studio/model/pick-starting-draft";

const SAVED_DRAFT: StudioDraft = {
    startSeconds: 10,
    endSeconds: 40,
    aspectRatio: "vertical",
    captionStyle: "karaoke",
    captionColor: "yellow",
    captionSize: "medium",
    captionPosition: "bottom",
    captionFont: "montserrat",
    cues: [],
};

const MY_EDITS: StudioDraft = { ...SAVED_DRAFT, captionColor: "green" };
const SERVER = { savedDraft: SAVED_DRAFT, draftVersion: 5 };

describe("pickStartingDraft", () => {
    it("starts from the server's draft when there is no backup", () => {
        expect(pickStartingDraft(SERVER, null)).toEqual({ draft: SAVED_DRAFT, version: 5 });
    });

    it("starts from a backup made on top of the server's version", () => {
        const backup = { baseVersion: 5, draft: MY_EDITS };

        expect(pickStartingDraft(SERVER, backup)).toEqual({ draft: MY_EDITS, version: 5 });
    });

    it("keeps edits made on an older version, on that version, so saving them asks first", () => {
        const backup = { baseVersion: 3, draft: MY_EDITS };

        expect(pickStartingDraft(SERVER, backup)).toEqual({ draft: MY_EDITS, version: 3 });
    });

    it("ignores an older backup the server already holds", () => {
        const backup = { baseVersion: 3, draft: { ...SAVED_DRAFT } };

        expect(pickStartingDraft(SERVER, backup)).toEqual({ draft: SAVED_DRAFT, version: 5 });
    });
});
