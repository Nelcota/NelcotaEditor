import { z } from "zod";
import {
    MAX_CUT_SECONDS,
    measureCutSeconds,
    presenterPlanSchema,
    sourceSecondsSchema as secondsSchema,
} from "#/modules/viral-formats/model/presenter-plan";

const MAX_PANELS = 300;
/** Where the presenter's eyes are by default, as a share of the frame height. */
export const DEFAULT_EYE_LINE = 0.35;

const panelSchema = z.discriminatedUnion("kind", [
    z.object({
        kind: z.literal("example"),
        at: secondsSchema.describe("When this panel starts, in seconds of the edited video."),
        sourceVideoId: z.uuid().describe("One of the person's videos to show in the top panel."),
        sourceStart: secondsSchema.describe("Where to start in that video, in seconds."),
    }),
    z.object({
        kind: z.literal("fullscreen"),
        at: secondsSchema.describe("When this panel starts, in seconds of the edited video."),
    }),
]);

export type SplitScreenPanel = z.infer<typeof panelSchema>;

function arePanelsInOrder(panels: ReadonlyArray<SplitScreenPanel>): boolean {
    return panels.every((panel, index) => index === 0 || panel.at > (panels[index - 1]?.at ?? 0));
}

/**
 * What a person's Claude sends to edit a raw talking head as "Tela dividida": the takes to keep,
 * in the order they play, and what the top panel shows from each moment of the edited video.
 */
export const splitScreenPlanSchema = presenterPlanSchema
    .extend({
        panels: z.array(panelSchema).min(1).max(MAX_PANELS),
        eyeLine: z
            .number()
            .min(0)
            .max(1)
            .default(DEFAULT_EYE_LINE)
            .describe("Where the presenter's eyes are, as a share of the frame height."),
    })
    .superRefine((plan, context) => {
        const cutSeconds = measureCutSeconds(plan.takes);
        const firstPanel = plan.panels[0];
        const lastPanel = plan.panels.at(-1);

        if (cutSeconds > MAX_CUT_SECONDS) {
            context.addIssue({
                code: "custom",
                path: ["takes"],
                message: `The edited video can be at most ${MAX_CUT_SECONDS} seconds long.`,
            });
        }

        if (firstPanel === undefined || firstPanel.at !== 0) {
            context.addIssue({
                code: "custom",
                path: ["panels"],
                message: "The first panel starts at 0.",
            });
        }

        if (arePanelsInOrder(plan.panels) === false) {
            context.addIssue({
                code: "custom",
                path: ["panels"],
                message: "Panels must be in order, each starting after the one before.",
            });
        }

        if (lastPanel !== undefined && lastPanel.at >= cutSeconds) {
            context.addIssue({
                code: "custom",
                path: ["panels"],
                message: "Every panel must start before the edited video ends.",
            });
        }
    });

export type SplitScreenPlan = z.output<typeof splitScreenPlanSchema>;
export type SplitScreenPlanInput = z.input<typeof splitScreenPlanSchema>;

export function listSplitScreenSourceIds(plan: SplitScreenPlan): Array<string> {
    return plan.panels
        .filter((panel) => panel.kind === "example")
        .map((panel) => panel.sourceVideoId);
}
