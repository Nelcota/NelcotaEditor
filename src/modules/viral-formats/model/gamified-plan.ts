import { z } from "zod";
import {
    MAX_CUT_SECONDS,
    measureCutSeconds,
    overlayTextSchema,
    presenterPlanSchema,
} from "#/modules/viral-formats/model/presenter-plan";

const MAX_HIGHLIGHTS = 12;
const MAX_HIGHLIGHT_LENGTH = 36;
const MAX_KEYWORDS = 24;
const MAX_KEYWORD_LENGTH = 30;
const MIN_TAKE_SECONDS = 0.04;
const MIN_HIGHLIGHT_SECONDS = 0.4;
const MAX_HIGHLIGHT_SECONDS = 5;
const TIME_TOLERANCE_SECONDS = 0.001;
const editedSecondsSchema = z.number().finite().nonnegative().max(MAX_CUT_SECONDS);

const highlightSchema = z.object({
    start: editedSecondsSchema.describe("Start in seconds of the edited video, after the cuts."),
    end: editedSecondsSchema.describe("End in seconds of the edited video, after the cuts."),
    label: overlayTextSchema
        .max(MAX_HIGHLIGHT_LENGTH)
        .describe("Short label grounded in what is said."),
    kind: z.enum(["step", "tip", "emphasis"]).describe("Icon and colour of the highlight."),
});

export type GamifiedHighlight = z.output<typeof highlightSchema>;

function areHighlightsInOrder(highlights: ReadonlyArray<GamifiedHighlight>): boolean {
    return highlights.every((highlight, index) => {
        const duration = highlight.end - highlight.start;
        return (
            highlight.start >= (highlights[index - 1]?.end ?? 0) &&
            duration + TIME_TOLERANCE_SECONDS >= MIN_HIGHLIGHT_SECONDS &&
            duration <= MAX_HIGHLIGHT_SECONDS + TIME_TOLERANCE_SECONDS
        );
    });
}

export const gamifiedPlanSchema = presenterPlanSchema
    .extend({
        keywords: z
            .array(overlayTextSchema.max(MAX_KEYWORD_LENGTH).regex(/^[\p{L}\p{M}\p{N}’'-]+$/u))
            .max(MAX_KEYWORDS)
            .default([])
            .describe("Individual words spoken in the kept takes to colour in the captions."),
        highlights: z
            .array(highlightSchema)
            .min(1)
            .max(MAX_HIGHLIGHTS)
            .describe("A few moments for a label, an icon, a short zoom and a cue sound."),
    })
    .refine((plan) => plan.takes.every((take) => take.end - take.start >= MIN_TAKE_SECONDS), {
        path: ["takes"],
        message: `Each take must last at least ${MIN_TAKE_SECONDS} seconds.`,
    })
    .refine((plan) => measureCutSeconds(plan.takes) <= MAX_CUT_SECONDS, {
        path: ["takes"],
        message: `The edited video can be at most ${MAX_CUT_SECONDS} seconds long.`,
    })
    .refine((plan) => areHighlightsInOrder(plan.highlights), {
        path: ["highlights"],
        message: `Highlights must be in order, must not overlap and must last ${MIN_HIGHLIGHT_SECONDS} to ${MAX_HIGHLIGHT_SECONDS} seconds.`,
    })
    .refine(
        (plan) =>
            (plan.highlights.at(-1)?.end ?? 0) <=
            measureCutSeconds(plan.takes) + TIME_TOLERANCE_SECONDS,
        {
            path: ["highlights"],
            message: "Highlights must end by the end of the edited video.",
        },
    );

export type GamifiedPlan = z.output<typeof gamifiedPlanSchema>;
