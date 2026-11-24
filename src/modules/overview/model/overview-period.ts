import { z } from "zod";

export const OVERVIEW_PERIOD_DAYS = [7, 30, 90] as const;

export const DEFAULT_OVERVIEW_PERIOD_DAYS = 30;

export const overviewPeriodSchema = z.union([z.literal(7), z.literal(30), z.literal(90)]);

export type OverviewPeriodDays = z.infer<typeof overviewPeriodSchema>;

export const overviewInputSchema = z.object({ periodDays: overviewPeriodSchema });

/** The Painel's URL state: which period is on. 30 days is the default and stays out of the URL. */
export const overviewSearchSchema = z.object({
    period: overviewPeriodSchema.optional().catch(undefined),
});
