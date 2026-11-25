import type { Db as JobDatabase } from "pg-boss";
import { z } from "zod";
import { getJobQueue } from "#/shared/server/job-queue.server";

export const RENDER_EDIT_QUEUE = "render-edit";

const TWO_HOURS_IN_SECONDS = 2 * 60 * 60;

export const renderEditJobSchema = z.object({ editId: z.uuid() });

export type RenderEditJob = z.infer<typeof renderEditJobSchema>;

let queueReadyPromise: Promise<void> | null = null;

// A render is expensive and its failure is recorded on the edit, so pg-boss does not retry it.
async function createRenderEditQueue(): Promise<void> {
    const jobQueue = await getJobQueue();
    await jobQueue.createQueue(RENDER_EDIT_QUEUE, {
        policy: "stately",
        expireInSeconds: TWO_HOURS_IN_SECONDS,
        retryLimit: 0,
    });
}

/** A failed attempt is forgotten, so a database hiccup does not break every later enqueue. */
async function createRenderEditQueueOrReset(): Promise<void> {
    try {
        await createRenderEditQueue();
    } catch (error) {
        queueReadyPromise = null;
        throw error;
    }
}

export function ensureRenderEditQueue(): Promise<void> {
    if (queueReadyPromise === null) {
        queueReadyPromise = createRenderEditQueueOrReset();
    }

    return queueReadyPromise;
}

/** Sent inside the transaction that inserts the edit, so neither exists without the other. */
export async function enqueueEditRender(editId: string, jobDatabase: JobDatabase): Promise<void> {
    await ensureRenderEditQueue();
    const jobQueue = await getJobQueue();
    const jobId = await jobQueue.send(RENDER_EDIT_QUEUE, { editId } satisfies RenderEditJob, {
        db: jobDatabase,
        singletonKey: editId,
    });

    if (jobId === null) {
        throw new Error(`Enqueuing the render of edit ${editId} returned no job`);
    }
}
