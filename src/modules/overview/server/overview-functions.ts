import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { overviewInputSchema } from "#/modules/overview/overview-period";
import type { OverviewStats } from "#/modules/overview/overview-views";
import { summarizeOverview } from "#/modules/overview/server/overview-stats.server";

export const getOverviewStats = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(overviewInputSchema)
    .handler(async ({ context, data }): Promise<OverviewStats> =>
        summarizeOverview(context.user.id, data.periodDays),
    );
