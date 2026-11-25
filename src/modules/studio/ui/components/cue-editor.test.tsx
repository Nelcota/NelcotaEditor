// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CaptionCue, StudioDraft } from "#/modules/clips/model/clip-studio";
import { CueEditor } from "#/modules/studio/ui/components/cue-editor";
import { TooltipProvider } from "#/shared/ui/tooltip";

const CUE: CaptionCue = {
    startSeconds: 10,
    endSeconds: 11,
    words: [
        { text: "bom", startSeconds: 10, endSeconds: 10.5 },
        { text: "dia", startSeconds: 10.5, endSeconds: 11 },
    ],
};

const DRAFT: StudioDraft = {
    startSeconds: 10,
    endSeconds: 40,
    aspectRatio: "vertical",
    captionStyle: "karaoke",
    captionColor: "yellow",
    captionSize: "medium",
    captionPosition: "bottom",
    captionFont: "montserrat",
    cues: [CUE],
};

afterEach(() => {
    cleanup();
});

describe("CueEditor", () => {
    it("stays open with the typed text when the edit is refused", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(
            <TooltipProvider>
                <CueEditor
                    draft={DRAFT}
                    index={0}
                    cue={CUE}
                    words={CUE.words}
                    onReplace={() => false}
                    onResetToOriginal={vi.fn()}
                    onClose={onClose}
                />
            </TooltipProvider>,
        );
        const field = screen.getByRole("textbox", { name: "Texto do bloco" });

        await user.clear(field);
        await user.type(field, "bom dia a todos{Enter}");

        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole("textbox", { name: "Texto do bloco" })).toHaveProperty(
            "value",
            "bom dia a todos",
        );
    });
});
