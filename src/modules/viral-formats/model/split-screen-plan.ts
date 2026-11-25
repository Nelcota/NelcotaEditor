import { z } from "zod";

/** A raw talking head of four hours is far past any Reel; the bound only stops absurd input. */
const MAX_SECONDS = 4 * 60 * 60;
const MAX_TAKES = 300;
const MAX_PANELS = 300;
export const MAX_EDIT_TITLE_LENGTH = 120;
/** Where the presenter's eyes are by default, as a share of the frame height. */
export const DEFAULT_EYE_LINE = 0.35;
/** The finished Reel is at most this long: the format is for short videos. */
export const MAX_CUT_SECONDS = 3 * 60;

const secondsSchema = z.number().finite().nonnegative().max(MAX_SECONDS);

const takeSchema = z
    .object({
        start: secondsSchema.describe("Start of the kept take, in seconds of the raw video."),
        end: secondsSchema.describe("End of the kept take, in seconds of the raw video."),
    })
    .refine((take) => take.end > take.start, { message: "A take must end after it starts." });

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
export type SplitScreenTake = z.infer<typeof takeSchema>;

/** The edited video's length: the takes played one after the other. */
export function measureCutSeconds(takes: ReadonlyArray<SplitScreenTake>): number {
    return takes.reduce((total, take) => total + (take.end - take.start), 0);
}

function arePanelsInOrder(panels: ReadonlyArray<SplitScreenPanel>): boolean {
    return panels.every((panel, index) => index === 0 || panel.at > (panels[index - 1]?.at ?? 0));
}

/**
 * What a person's Claude sends to edit a raw talking head as "Tela dividida": the takes to keep,
 * in the order they play, and what the top panel shows from each moment of the edited video.
 */
export const splitScreenPlanSchema = z
    .object({
        videoId: z.uuid().describe("The raw talking-head video to edit, from list_my_videos."),
        title: z.string().trim().min(1).max(MAX_EDIT_TITLE_LENGTH),
        takes: z.array(takeSchema).min(1).max(MAX_TAKES),
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
