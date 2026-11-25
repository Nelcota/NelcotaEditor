// @vitest-environment happy-dom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { EditStatus } from "#/modules/viral-formats/model/edit-status";
import type { EditView } from "#/modules/viral-formats/model/edit-view";
import { useFinishedEditsAnnouncement } from "#/modules/viral-formats/ui/hooks/use-finished-edits-announcement";

function edit(id: string, title: string, status: EditStatus): EditView {
    return {
        id,
        title,
        format: "split-screen",
        status,
        errorMessage: null,
        createdAt: "2026-11-25T12:00:00.000Z",
    };
}

afterEach(() => {
    cleanup();
});

describe("useFinishedEditsAnnouncement", () => {
    it("stays quiet about edits that were already finished when the page opened", () => {
        const { result } = renderHook(() =>
            useFinishedEditsAnnouncement([edit("a", "Formatos virais", "done")]),
        );

        expect(result.current).toBe("");
    });

    it("announces an edit that finishes while the page is open", () => {
        const { result, rerender } = renderHook(
            ({ edits }: { edits: Array<EditView> }) => useFinishedEditsAnnouncement(edits),
            { initialProps: { edits: [edit("a", "Formatos virais", "rendering")] } },
        );

        rerender({ edits: [edit("a", "Formatos virais", "done")] });

        expect(result.current).toBe("Formatos virais está pronta.");
    });

    it("announces a failed edit", () => {
        const { result, rerender } = renderHook(
            ({ edits }: { edits: Array<EditView> }) => useFinishedEditsAnnouncement(edits),
            { initialProps: { edits: [edit("a", "Café", "queued")] } },
        );

        rerender({ edits: [edit("a", "Café", "failed")] });

        expect(result.current).toBe("Café não deu certo.");
    });

    it("stays quiet when a queued edit only starts rendering", () => {
        const { result, rerender } = renderHook(
            ({ edits }: { edits: Array<EditView> }) => useFinishedEditsAnnouncement(edits),
            { initialProps: { edits: [edit("a", "Café", "queued")] } },
        );

        rerender({ edits: [edit("a", "Café", "rendering")] });

        expect(result.current).toBe("");
    });
});
