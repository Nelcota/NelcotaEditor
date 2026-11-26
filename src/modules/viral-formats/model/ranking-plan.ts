import { z } from "zod";
import {
    MAX_RANKED_ITEMS,
    MIN_RANKED_ITEMS,
    rankedItemSchema,
    rankedItemsCheck,
    rankedPresenterSchema,
    rankedTakesCheck,
} from "#/modules/viral-formats/model/ranked-presenter-plan";

export const rankingPlanSchema = rankedPresenterSchema
    .extend({
        items: z
            .array(rankedItemSchema)
            .min(MIN_RANKED_ITEMS)
            .max(MAX_RANKED_ITEMS)
            .describe(
                "Ranked items in playback order. Use the presenter's own ranks, including countdowns from worst to best.",
            ),
    })
    .check(rankedTakesCheck, rankedItemsCheck);

export type RankingPlan = z.output<typeof rankingPlanSchema>;
