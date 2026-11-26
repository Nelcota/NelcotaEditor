import { describe, expect, it } from "vitest";
import { buildRankingOverlay } from "#/modules/viral-formats/model/ranking-overlay";
import { rankingPlanSchema } from "#/modules/viral-formats/model/ranking-plan";

const PLAN = {
    videoId: "00000000-0000-4000-8000-000000000001",
    title: "Ferramentas de gravação",
    topic: "Melhores ferramentas de gravação",
    takes: [
        { start: 1, end: 3 },
        { start: 5, end: 8 },
    ],
    items: [
        { position: 3, at: 1, label: "Tripé" },
        { position: 2, at: 2, label: "Microfone" },
        { position: 1, at: 3, label: "Luz natural" },
    ],
    outroAt: 4,
};

describe("Ranking", () => {
    it("reveals the current label without changing its row position or exposing later labels", () => {
        const overlay = buildRankingOverlay(rankingPlanSchema.parse(PLAN), []);

        expect(overlay).toMatch(/0:00:00\.00,0:00:03\.00,Row[^\n]*pos\(182,1526\)[^\n]*…/u);
        expect(overlay).toMatch(/0:00:01\.00,0:00:02\.00,Board[^\n]*pos\(100,1626\)[^\n]*00F8C4/u);
        expect(overlay).toMatch(/0:00:01\.00,0:00:02\.00,Row[^\n]*▶/u);
        expect(overlay).toMatch(/0:00:02\.00,0:00:04\.00,Row[^\n]*Tripé/u);
        expect(overlay).toMatch(/0:00:03\.00,0:00:04\.00,Row[^\n]*Luz natural/u);
    });

    it("keeps spoken captions on the edited clock after removing the list for the closing", () => {
        const overlay = buildRankingOverlay(rankingPlanSchema.parse(PLAN), [
            { text: "Pausa", startSeconds: 3.2, endSeconds: 3.8 },
            { text: "Experimente.", startSeconds: 7.1, endSeconds: 7.6 },
        ]);

        expect(overlay).not.toContain("Pausa");
        expect(overlay).toMatch(/0:00:00\.00,0:00:04\.00,Topic/u);
        expect(overlay).toMatch(
            /0:00:04\.10,0:00:04\.60,Caption[^\n]*pos\(540,1390\)[^\n]*Experimente\./u,
        );
    });

    it("supports ten positions and rejects a rank outside the list", () => {
        const items = Array.from({ length: 10 }, (_entry, index) => ({
            position: 10 - index,
            at: index * 0.35,
            label: `Item ${10 - index}`,
        }));
        const result = rankingPlanSchema.safeParse({ ...PLAN, items });
        const invalid = rankingPlanSchema.safeParse({ ...PLAN, items: items.slice(0, 9) });

        expect(result.success).toBe(true);
        expect(invalid.success).toBe(false);
    });
});
