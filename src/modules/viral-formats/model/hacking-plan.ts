import { z } from "zod";
import {
    MIN_RANKED_ITEMS,
    rankedItemSchema,
    rankedItemsCheck,
    rankedPresenterSchema,
    rankedTakesCheck,
} from "#/modules/viral-formats/model/ranked-presenter-plan";

const MAX_ITEMS = 8;
const itemSchema = rankedItemSchema.extend({
    position: rankedItemSchema.shape.position.max(MAX_ITEMS),
    marker: z
        .string()
        .trim()
        .regex(/^[\p{L}\p{N}]{1,3}$/u)
        .optional()
        .describe(
            "One to three initials or digits for the item's small badge. Omit to use its initials.",
        ),
});

export type HackingItem = z.output<typeof itemSchema>;

export const hackingPlanSchema = rankedPresenterSchema
    .extend({
        items: z
            .array(itemSchema)
            .min(MIN_RANKED_ITEMS)
            .max(MAX_ITEMS)
            .describe(
                "The actual items in the order they are revealed. A countdown can reveal the highest position first.",
            ),
    })
    .check(rankedTakesCheck, rankedItemsCheck);

export type HackingPlan = z.output<typeof hackingPlanSchema>;
