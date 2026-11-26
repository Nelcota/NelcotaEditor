import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildContrastOverlay } from "#/modules/viral-formats/model/contrast-overlay";
import { contrastPlanSchema } from "#/modules/viral-formats/model/contrast-plan";

const PLAN = {
    videoId: randomUUID(),
    title: "Fones de ouvido",
    topic: "FONES DE OUVIDO",
    takes: [
        { start: 10, end: 13 },
        { start: 22, end: 25 },
    ],
    comparisons: [
        { start: 1, end: 2, label: "Com fio", verdict: "good" },
        { start: 3, end: 5, label: "Sem fio", verdict: "bad" },
    ],
};

describe("Contraste overlays", () => {
    it("uses the edited clock for the topic and each verdict", () => {
        const overlay = buildContrastOverlay(contrastPlanSchema.parse(PLAN));

        expect(overlay).toMatch(/0:00:00\.00,0:00:06\.00,Topic[^\n]*FONES DE OUVIDO/u);
        expect(overlay).toMatch(/0:00:01\.00,0:00:02\.00,Good[^\n]*BOM/u);
        expect(overlay).toMatch(/0:00:03\.00,0:00:05\.00,Bad[^\n]*RUIM/u);
        expect(overlay).toContain("BOM · Com fio");
        expect(overlay).toContain("RUIM · Sem fio");
    });

    it("rejects comparisons that overlap or extend past the cut", () => {
        const overlapping = [
            ...PLAN.comparisons,
            { start: 4, end: 6, label: "Extra", verdict: "good" },
        ];
        const afterCut = [{ start: 5, end: 7, label: "Extra", verdict: "good" }];

        expect(contrastPlanSchema.safeParse({ ...PLAN, comparisons: overlapping }).success).toBe(
            false,
        );
        expect(contrastPlanSchema.safeParse({ ...PLAN, comparisons: afterCut }).success).toBe(
            false,
        );
    });

    it("rejects subtitle overrides and event breaks in overlay text", () => {
        for (const topic of ["One\nTwo", "{\\pos(1,1)}Topic"]) {
            expect(contrastPlanSchema.safeParse({ ...PLAN, topic }).success).toBe(false);
        }
    });
});
