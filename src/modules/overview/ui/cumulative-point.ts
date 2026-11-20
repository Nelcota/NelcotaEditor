import { z } from "zod";

export const cumulativePointSchema = z.object({
    day: z.string(),
    current: z.number(),
    previous: z.number(),
});

export type CumulativePoint = z.infer<typeof cumulativePointSchema>;
