import { z } from "zod";
import {
    MAX_CUT_SECONDS,
    measureCutSeconds,
    overlayTextSchema,
    presenterPlanSchema,
} from "#/modules/viral-formats/model/presenter-plan";

const MIN_ITEMS = 2;
const MAX_ITEMS = 8;
const MAX_TOPIC_LENGTH = 48;
const MAX_ITEM_LENGTH = 34;
const MIN_TAKE_SECONDS = 0.04;
const MIN_REVEAL_SECONDS = 0.3;
const TIME_TOLERANCE_SECONDS = 0.001;
const editedSecondsSchema = z.number().finite().nonnegative().max(MAX_CUT_SECONDS);

const itemSchema = z.object({
    position: z
        .number()
        .int()
        .min(1)
        .max(MAX_ITEMS)
        .describe("Rank shown above the item, from 1 to the number of items."),
    at: editedSecondsSchema.describe(
        "When the speaker introduces the item, in edited seconds after the cuts.",
    ),
    label: overlayTextSchema
        .max(MAX_ITEM_LENGTH)
        .describe("Short name of a tool or tip mentioned by the speaker."),
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

function hasEveryPosition(items: ReadonlyArray<HackingItem>): boolean {
    const positions = new Set(items.map((item) => item.position));
    return positions.size === items.length && items.every((item) => item.position <= items.length);
}

function areRevealsInOrder(items: ReadonlyArray<HackingItem>): boolean {
    for (const [index, item] of items.entries()) {
        const previous = items[index - 1];

        if (
            previous !== undefined &&
            item.at - previous.at + TIME_TOLERANCE_SECONDS < MIN_REVEAL_SECONDS
        ) {
            return false;
        }
    }

    return true;
}

function hasRoomForOutro(plan: {
    takes: z.output<typeof presenterPlanSchema>["takes"];
    items: Array<HackingItem>;
    outroAt?: number | undefined;
}): boolean {
    const duration = measureCutSeconds(plan.takes);
    const boardEnd = plan.outroAt ?? duration;
    const lastReveal = plan.items.at(-1)?.at ?? 0;
    return (
        boardEnd <= duration + TIME_TOLERANCE_SECONDS &&
        boardEnd - lastReveal + TIME_TOLERANCE_SECONDS >= MIN_REVEAL_SECONDS
    );
}

export const hackingPlanSchema = presenterPlanSchema
    .extend({
        topic: overlayTextSchema
            .max(MAX_TOPIC_LENGTH)
            .describe("Short topic of the list, in the speaker's language."),
        items: z
            .array(itemSchema)
            .min(MIN_ITEMS)
            .max(MAX_ITEMS)
            .describe(
                "The actual items in the order they are revealed. A countdown can reveal the highest position first.",
            ),
        outroAt: editedSecondsSchema
            .optional()
            .describe(
                "When to hide the list and topic for the closing, in edited seconds. Omit to show the board until the end.",
            ),
    })
    .refine((plan) => plan.takes.every((take) => take.end - take.start >= MIN_TAKE_SECONDS), {
        path: ["takes"],
        message: `Each take must last at least ${MIN_TAKE_SECONDS} seconds.`,
    })
    .refine((plan) => measureCutSeconds(plan.takes) <= MAX_CUT_SECONDS, {
        path: ["takes"],
        message: `The edited video can be at most ${MAX_CUT_SECONDS} seconds long.`,
    })
    .refine((plan) => hasEveryPosition(plan.items), {
        path: ["items"],
        message: "Use each rank from 1 through the number of items exactly once.",
    })
    .refine((plan) => areRevealsInOrder(plan.items), {
        path: ["items"],
        message: `Reveals must be in playback order and at least ${MIN_REVEAL_SECONDS} seconds apart.`,
    })
    .refine(hasRoomForOutro, {
        path: ["outroAt"],
        message: `The board must stay visible for at least ${MIN_REVEAL_SECONDS} seconds after the final reveal and end within the edited video.`,
    });

export type HackingPlan = z.output<typeof hackingPlanSchema>;
