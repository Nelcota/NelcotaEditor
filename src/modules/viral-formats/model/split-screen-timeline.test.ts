import { describe, expect, it } from "vitest";
import { buildWordCaptions } from "#/modules/viral-formats/model/split-screen-captions";
import { splitScreenPlanSchema } from "#/modules/viral-formats/model/split-screen-plan";
import { toCutWords, toPanelPieces } from "#/modules/viral-formats/model/split-screen-timeline";

const VIDEO_ID = "0190a6c5-0000-7000-8000-000000000001";
const SOURCE_ID = "0190a6c5-0000-7000-8000-000000000002";

function word(text: string, startSeconds: number, endSeconds: number) {
    return { text, startSeconds, endSeconds };
}

describe("toCutWords", () => {
    it("moves the kept words onto the edited video's clock and drops the cut ones", () => {
        const takes = [
            { start: 10, end: 12 },
            { start: 20, end: 21 },
        ];
        const words = [
            word("Olha", 10.1, 10.5),
            word("isso!", 10.6, 11),
            word("errei", 15, 15.4),
            word("Vende", 20.2, 20.6),
        ];

        const cutWords = toCutWords(takes, words);

        expect(cutWords.map((cutWord) => cutWord.text)).toEqual(["olha", "isso", "vende"]);
        expect(cutWords[2]?.start).toBeCloseTo(2.2);
    });

    it("keeps a word cut in half only in the take that holds its middle", () => {
        const takes = [{ start: 0, end: 1 }];

        const cutWords = toCutWords(takes, [word("meio", 0.8, 1.6)]);

        expect(cutWords).toEqual([]);
    });
});

describe("toPanelPieces", () => {
    it("runs each panel until the next and the last one until the video ends", () => {
        const takes = [{ start: 0, end: 10 }];
        const panels = [
            { kind: "example" as const, at: 0, sourceVideoId: SOURCE_ID, sourceStart: 3 },
            { kind: "fullscreen" as const, at: 6 },
        ];

        const pieces = toPanelPieces(panels, takes);

        expect(pieces.map((piece) => [piece.start, piece.end])).toEqual([
            [0, 6],
            [6, 10],
        ]);
    });
});

describe("splitScreenPlanSchema", () => {
    it("refuses panels that do not start at zero", () => {
        const result = splitScreenPlanSchema.safeParse({
            videoId: VIDEO_ID,
            title: "Formatos virais",
            takes: [{ start: 0, end: 5 }],
            panels: [{ kind: "fullscreen", at: 1 }],
        });

        expect(result.success).toBe(false);
    });

    it("refuses a panel that starts after the edited video ends", () => {
        const result = splitScreenPlanSchema.safeParse({
            videoId: VIDEO_ID,
            title: "Formatos virais",
            takes: [{ start: 0, end: 5 }],
            panels: [
                { kind: "fullscreen", at: 0 },
                { kind: "fullscreen", at: 5 },
            ],
        });

        expect(result.success).toBe(false);
    });
});

describe("buildWordCaptions", () => {
    it("puts one word per event on the seam and on the chest during full screen", () => {
        const pieces = [
            { kind: "fullscreen" as const, at: 0, start: 0, end: 1 },
            {
                kind: "example" as const,
                at: 1,
                start: 1,
                end: 3,
                sourceVideoId: SOURCE_ID,
                sourceStart: 0,
            },
        ];
        const words = [
            { text: "oi", start: 0.2, end: 0.4 },
            { text: "gente", start: 1.5, end: 1.9 },
        ];

        const captions = buildWordCaptions(words, pieces);

        expect(captions).toContain("\\pos(540,1284)\\fscx80\\t(0,50,\\fscx100)}oi");
        expect(captions).toContain("\\pos(540,960)\\fscx80\\t(0,50,\\fscx100)}gente");
    });

    it("holds a word until the next one when the pause between them is short", () => {
        const words = [
            { text: "um", start: 0, end: 0.3 },
            { text: "dois", start: 0.35, end: 0.6 },
        ];

        const captions = buildWordCaptions(words, []);

        expect(captions).toContain("Dialogue: 0,0:00:00.00,0:00:00.35,Word");
    });
});
