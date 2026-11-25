import { and, eq, lt } from "drizzle-orm";
import { db } from "#/db/database.server";
import { ANSWERED_TICKET_IDLE_DAYS } from "#/modules/support/model/support-ticket";
import { supportTickets } from "#/modules/support/support.schema";
import { getJobQueue } from "#/shared/server/job-queue.server";
import { logger } from "#/shared/server/logger.server";

const CLOSE_IDLE_TICKETS_QUEUE = "close-idle-support-tickets";
const EVERY_DAY_AT_FOUR = "0 4 * * *";
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Answered tickets nobody came back to; the person can still reopen one by answering. */
export async function closeIdleTickets(now: Date): Promise<number> {
    const idleSince = new Date(now.getTime() - ANSWERED_TICKET_IDLE_DAYS * MILLISECONDS_PER_DAY);
    const closed = await db
        .update(supportTickets)
        .set({ status: "closed" })
        .where(
            and(eq(supportTickets.status, "answered"), lt(supportTickets.lastMessageAt, idleSince)),
        )
        .returning({ id: supportTickets.id });

    return closed.length;
}

/** pg-boss records a failed handler only on the job; this line says why. Tomorrow tries again. */
async function closeIdleTicketsWithLog(): Promise<void> {
    try {
        const closedCount = await closeIdleTickets(new Date());
        logger.info({ closedCount }, "Idle support tickets closed");
    } catch (error) {
        logger.error({ error }, "Could not close idle support tickets");
    }
}

/** The schedule lives in the database, so worker replicas share one run a day. */
export async function startIdleTicketClosing(): Promise<void> {
    const jobQueue = await getJobQueue();

    await jobQueue.createQueue(CLOSE_IDLE_TICKETS_QUEUE, { policy: "singleton", retryLimit: 0 });
    await jobQueue.schedule(CLOSE_IDLE_TICKETS_QUEUE, EVERY_DAY_AT_FOUR);
    await jobQueue.work(CLOSE_IDLE_TICKETS_QUEUE, closeIdleTicketsWithLog);
}
