import { describe, expect, it } from "vitest";
import { buildHackingOverlay } from "#/modules/viral-formats/model/hacking-overlay";
import { hackingPlanSchema } from "#/modules/viral-formats/model/hacking-plan";

const PLAN = {
    videoId: "00000000-0000-4000-8000-000000000001",
    title: "Ferramentas de edição",
    topic: "Ferramentas para editar vídeo rápido",
    takes: [
        { start: 1, end: 3 },
        { start: 5, end: 8 },
    ],
    items: [
        { position: 3, at: 1, label: "CapCut", marker: "CC" },
        { position: 2, at: 2, label: "Edits" },
        { position: 1, at: 3, label: "Editor Oculto" },
    ],
    outroAt: 4,
};

describe("Hacking", () => {
    it("shows the ranks from the start and keeps each marker under its own rank after the reveal", () => {
        const overlay = buildHackingOverlay(hackingPlanSchema.parse(PLAN), []);

        expect(overlay).toMatch(/0:00:00\.00,0:00:04\.00,Number[^\n]*pos\(364,270\)[^\n]*1/u);
        expect(overlay).toMatch(/0:00:00\.00,0:00:04\.00,Number[^\n]*pos\(716,270\)[^\n]*3/u);
        expect(overlay).toMatch(/0:00:01\.00,0:00:04\.00,Marker[^\n]*pos\(716,394\)[^\n]*CC/u);
        expect(overlay).toMatch(/0:00:03\.00,0:00:04\.00,Marker[^\n]*pos\(364,394\)[^\n]*EO/u);
        expect(overlay).toMatch(/0:00:01\.00,0:00:02\.00,Spotlight[^\n]*3 · CapCut/u);
    });

    it("keeps captions on the edited clock after the rank board goes away", () => {
        const overlay = buildHackingOverlay(hackingPlanSchema.parse(PLAN), [
            { text: "Corte descartado", startSeconds: 3.1, endSeconds: 3.8 },
            { text: "Experimente", startSeconds: 7.1, endSeconds: 7.3 },
            { text: "hoje.", startSeconds: 7.31, endSeconds: 7.6 },
        ]);

        expect(overlay).not.toContain("Corte descartado");
        expect(overlay).toMatch(/0:00:00\.00,0:00:04\.00,Topic/u);
        expect(overlay).toMatch(/0:00:04\.10,0:00:04\.60,Caption[^\n]*Experimente hoje\./u);
    });

    it("rejects duplicate or missing ranks, early closings, unordered reveals and ASS tags", () => {
        const secondItem = { position: 2, at: 2, label: "Edits" };
        const plans = [
            { ...PLAN, items: [...PLAN.items, { ...secondItem, at: 3.5 }] },
            { ...PLAN, items: [{ ...secondItem, position: 4, at: 1 }, ...PLAN.items.slice(1)] },
            { ...PLAN, outroAt: 2.5 },
            { ...PLAN, items: PLAN.items.toReversed() },
            { ...PLAN, topic: "{\\pos(1,1)}Unsupported tag" },
        ];

        for (const plan of plans) {
            expect(hackingPlanSchema.safeParse(plan).success).toBe(false);
        }
    });
});
