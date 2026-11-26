import { describe, expect, it } from "vitest";
import { buildGamifiedOverlay } from "#/modules/viral-formats/model/gamified-overlay";
import { gamifiedPlanSchema } from "#/modules/viral-formats/model/gamified-plan";

const PLAN = {
    videoId: "00000000-0000-4000-8000-000000000001",
    title: "Como editar",
    takes: [
        { start: 1, end: 3 },
        { start: 5, end: 8 },
    ],
    keywords: ["edição"],
    highlights: [{ start: 2, end: 3, label: "Passo 1", kind: "step" }],
};

describe("Dinâmico gamificado", () => {
    it("colours spoken keywords on the edited clock and overlays the planned highlights", () => {
        const overlay = buildGamifiedOverlay(gamifiedPlanSchema.parse(PLAN), [
            { text: "Retomada", startSeconds: 3.5, endSeconds: 4.2 },
            { text: "Edição,", startSeconds: 5.2, endSeconds: 5.45 },
            { text: "rápida", startSeconds: 5.5, endSeconds: 5.9 },
        ]);

        expect(overlay).not.toContain("Retomada");
        expect(overlay).toContain("0:00:02.20,0:00:02.90,Caption");
        expect(overlay).toContain(String.raw`{\c&H00E5FF&}Edição,{\c&HFFFFFF&} rápida`);
        expect(overlay).toMatch(/0:00:02\.00,0:00:03\.00,Step[^\n]*→  Passo 1/u);
    });

    it("rejects overlapping highlights, highlights outside the cut and markup in their labels", () => {
        const invalidHighlights = [
            [...PLAN.highlights, { start: 2.5, end: 4, label: "Passo 2", kind: "step" }],
            [{ start: 4, end: 6, label: "Fora do vídeo", kind: "tip" }],
            [{ start: 2, end: 3, label: "{\\pos(1,1)}Texto", kind: "tip" }],
        ];

        for (const highlights of invalidHighlights) {
            expect(gamifiedPlanSchema.safeParse({ ...PLAN, highlights }).success).toBe(false);
        }
    });

    it("starts a fresh caption after a sentence even when there is no pause", () => {
        const overlay = buildGamifiedOverlay(gamifiedPlanSchema.parse(PLAN), [
            { text: "Pronto.", startSeconds: 1.4, endSeconds: 1.7 },
            { text: "Agora", startSeconds: 1.7, endSeconds: 2 },
            { text: "revise.", startSeconds: 2, endSeconds: 2.3 },
        ]);

        expect(overlay).toMatch(/0:00:00\.40,0:00:00\.70,Caption[^\n]*Pronto\./u);
        expect(overlay).toMatch(/0:00:00\.70,0:00:01\.30,Caption[^\n]*Agora revise\./u);
    });
});
