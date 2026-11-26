import { z } from "zod";
import {
    MAX_CUT_SECONDS,
    measureCutSeconds,
    presenterPlanSchema,
} from "#/modules/viral-formats/model/presenter-plan";

const MAX_COMPARISONS = 30;
const MAX_OVERLAY_LENGTH = 44;
const MIN_VISIBLE_SECONDS = 0.25;
const MIN_TAKE_SECONDS = 0.04;
const overlaySecondsSchema = z.number().finite().min(0).max(MAX_CUT_SECONDS);
// ASS treats braces and backslashes as tags. One line prevents additional events in the file.
const overlayTextSchema = z
    .string()
    .trim()
    .min(1)
    .max(MAX_OVERLAY_LENGTH)
    .regex(/^[^\p{Cc}\p{Cf}\p{Zl}\p{Zp}{}\\]+$/u);

const comparisonSchema = z.object({
    start: overlaySecondsSchema.describe("Start in seconds of the edited video."),
    end: overlaySecondsSchema.describe("End in seconds of the edited video."),
    label: overlayTextSchema.describe("Short name of the option as discussed by the presenter."),
    verdict: z.enum(["good", "bad"]).describe("The presenter's verdict on this option."),
});

function haveOrderedComparisons(
    comparisons: ReadonlyArray<z.output<typeof comparisonSchema>>,
): boolean {
    return comparisons.every((comparison, index) => {
        const previousEnd = comparisons[index - 1]?.end ?? 0;
        return (
            comparison.start >= previousEnd &&
            comparison.end - comparison.start >= MIN_VISIBLE_SECONDS
        );
    });
}

export const contrastPlanSchema = presenterPlanSchema
    .extend({
        topic: overlayTextSchema.describe("Short heading in the same language as the presenter."),
        comparisons: z.array(comparisonSchema).min(1).max(MAX_COMPARISONS),
    })
    .refine((plan) => plan.takes.every((take) => take.end - take.start >= MIN_TAKE_SECONDS), {
        path: ["takes"],
        message: "Each take must last at least 0.04 seconds.",
    })
    .refine((plan) => measureCutSeconds(plan.takes) <= MAX_CUT_SECONDS, {
        path: ["takes"],
        message: `The edited video can be at most ${MAX_CUT_SECONDS} seconds long.`,
    })
    .refine((plan) => haveOrderedComparisons(plan.comparisons), {
        path: ["comparisons"],
        message: `Comparisons must be in order, without overlap, and last at least ${MIN_VISIBLE_SECONDS} seconds.`,
    })
    .refine(
        (plan) => (plan.comparisons.at(-1)?.end ?? 0) <= measureCutSeconds(plan.takes) + 0.001,
        {
            path: ["comparisons"],
            message: "Comparisons must end by the end of the edited video.",
        },
    );

export type ContrastPlan = z.output<typeof contrastPlanSchema>;
