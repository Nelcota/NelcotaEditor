import { z } from "zod";

const MAX_SOURCE_SECONDS = 4 * 60 * 60;
const MAX_TAKES = 300;
export const MAX_EDIT_TITLE_LENGTH = 120;
export const MAX_CUT_SECONDS = 3 * 60;

export const sourceSecondsSchema = z.number().finite().nonnegative().max(MAX_SOURCE_SECONDS);

const takeSchema = z
    .object({
        start: sourceSecondsSchema.describe("Start of the kept take, in seconds of the raw video."),
        end: sourceSecondsSchema.describe("End of the kept take, in seconds of the raw video."),
    })
    .refine((take) => take.end > take.start, { message: "A take must end after it starts." });

export const presenterPlanSchema = z.object({
    videoId: z
        .uuid()
        .describe("The raw talking-head video from list_edit_queue or list_my_videos."),
    sessionId: z
        .uuid()
        .optional()
        .describe("The batch from list_edit_queue. Omit for a standalone edit requested in chat."),
    title: z.string().trim().min(1).max(MAX_EDIT_TITLE_LENGTH),
    takes: z.array(takeSchema).min(1).max(MAX_TAKES),
});

export type PresenterPlan = z.output<typeof presenterPlanSchema>;
export type PresenterTake = z.output<typeof takeSchema>;

export function measureCutSeconds(takes: ReadonlyArray<PresenterTake>): number {
    return takes.reduce((total, take) => total + (take.end - take.start), 0);
}
