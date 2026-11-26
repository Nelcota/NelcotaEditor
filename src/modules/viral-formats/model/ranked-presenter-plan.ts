import { z } from "zod";
import {
    MAX_CUT_SECONDS,
    measureCutSeconds,
    overlayTextSchema,
    presenterPlanSchema,
} from "#/modules/viral-formats/model/presenter-plan";

export const MIN_RANKED_ITEMS = 2;
export const MAX_RANKED_ITEMS = 10;
const MAX_TOPIC_LENGTH = 48;
const MAX_ITEM_LENGTH = 34;
const MIN_TAKE_SECONDS = 0.04;
const MIN_REVEAL_SECONDS = 0.3;
const TIME_TOLERANCE_SECONDS = 0.001;
const editedSecondsSchema = z.number().finite().nonnegative().max(MAX_CUT_SECONDS);

export const rankedItemSchema = z.object({
    position: z
        .number()
        .int()
        .min(1)
        .max(MAX_RANKED_ITEMS)
        .describe("Rank from 1 to the number of items."),
    at: editedSecondsSchema.describe(
        "When the speaker introduces the item, in edited seconds after the cuts.",
    ),
    label: overlayTextSchema
        .max(MAX_ITEM_LENGTH)
        .describe("Short name of the item mentioned by the speaker."),
});

export type RankedItem = z.output<typeof rankedItemSchema>;

export const rankedPresenterSchema = presenterPlanSchema.extend({
    topic: overlayTextSchema
        .max(MAX_TOPIC_LENGTH)
        .describe("Short topic of the list, in the speaker's language."),
    outroAt: editedSecondsSchema
        .optional()
        .describe(
            "When to hide the list and topic for the closing, in edited seconds. Omit to show the list until the end.",
        ),
});

type RankedPresentation = z.output<typeof rankedPresenterSchema> & {
    items: ReadonlyArray<RankedItem>;
};

function hasEveryPosition(items: ReadonlyArray<RankedItem>): boolean {
    const positions = new Set(items.map((item) => item.position));
    return positions.size === items.length && items.every((item) => item.position <= items.length);
}

function areRevealsInOrder(items: ReadonlyArray<RankedItem>): boolean {
    return items.every((item, index) => {
        const previous = items[index - 1];
        return (
            previous === undefined ||
            item.at - previous.at + TIME_TOLERANCE_SECONDS >= MIN_REVEAL_SECONDS
        );
    });
}

function checkRankedItems(payload: z.core.ParsePayload<RankedPresentation>): void {
    const { value, issues } = payload;
    const { items, outroAt, takes } = value;
    const duration = measureCutSeconds(takes);
    const boardEnd = outroAt ?? duration;
    const lastReveal = items.at(-1)?.at ?? 0;

    if (hasEveryPosition(items) === false) {
        issues.push({
            code: "custom",
            input: items,
            path: ["items"],
            message: "Use each rank from 1 through the number of items exactly once.",
        });
    }

    if (areRevealsInOrder(items) === false) {
        issues.push({
            code: "custom",
            input: items,
            path: ["items"],
            message: `Reveals must be in playback order and at least ${MIN_REVEAL_SECONDS} seconds apart.`,
        });
    }

    if (
        boardEnd > duration + TIME_TOLERANCE_SECONDS ||
        boardEnd - lastReveal + TIME_TOLERANCE_SECONDS < MIN_REVEAL_SECONDS
    ) {
        issues.push({
            code: "custom",
            input: outroAt,
            path: ["outroAt"],
            message: `The list must stay visible for at least ${MIN_REVEAL_SECONDS} seconds after the final reveal and end within the edited video.`,
        });
    }
}

export const rankedItemsCheck = z.check(checkRankedItems);

export const rankedTakesCheck = z.check(
    (payload: z.core.ParsePayload<RankedPresentation>): void => {
        const { takes } = payload.value;
        const { issues } = payload;

        if (takes.some((take) => take.end - take.start < MIN_TAKE_SECONDS)) {
            issues.push({
                code: "custom",
                input: takes,
                path: ["takes"],
                message: `Each take must last at least ${MIN_TAKE_SECONDS} seconds.`,
            });
        }

        if (measureCutSeconds(takes) > MAX_CUT_SECONDS) {
            issues.push({
                code: "custom",
                input: takes,
                path: ["takes"],
                message: `The edited video can be at most ${MAX_CUT_SECONDS} seconds long.`,
            });
        }
    },
);
