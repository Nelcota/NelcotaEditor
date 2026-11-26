import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "#/db/database.server";
import { contrastPlanSchema } from "#/modules/viral-formats/model/contrast-plan";
import {
    InvalidEditJobError,
    MissingEditSourceError,
} from "#/modules/viral-formats/model/edit-errors";
import { findTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import { videos } from "#/modules/video-records/video-records.schema";
import {
    listSplitScreenSourceIds,
    splitScreenPlanSchema,
} from "#/modules/viral-formats/model/split-screen-plan";
import {
    RENDER_EDIT_QUEUE,
    ensureRenderEditQueue,
    renderEditJobSchema,
} from "#/modules/viral-formats/server/edit-render-queue.server";
import { renderContrast } from "#/modules/viral-formats/server/render-contrast.server";
import { renderSplitScreen } from "#/modules/viral-formats/server/render-split-screen.server";
import type { Edit } from "#/modules/viral-formats/viral-formats.schema";
import { edits } from "#/modules/viral-formats/viral-formats.schema";
import { getEnvironment } from "#/shared/server/env.server";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getJobQueue } from "#/shared/server/job-queue.server";
import { logger, withLogContext } from "#/shared/server/logger.server";

/** The person reads this; what went wrong goes to the log. */
const RENDER_FAILED_MESSAGE =
    "Não foi possível montar o vídeo. Peça ao Claude para tentar de novo.";
const RENDER_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const EDITS_WORK_FOLDER = "edits";

/** Takes the edit only while it waits, so a second delivery of the job renders nothing twice. */
async function claimEdit(editId: string): Promise<Edit | null> {
    const rows = await db
        .update(edits)
        .set({ status: "rendering", errorMessage: null })
        .where(and(eq(edits.id, editId), eq(edits.status, "queued")))
        .returning();

    return rows[0] ?? null;
}

/** Every video the plan reads, downloaded into the work folder when storage is remote. */
async function prepareLocalVideos(
    userId: string,
    videoIds: Array<string>,
    workDirectory: string,
): Promise<Map<string, string>> {
    const rows = await db
        .select({ id: videos.id, sourcePath: videos.sourcePath })
        .from(videos)
        .where(and(eq(videos.userId, userId), inArray(videos.id, videoIds)));
    const storage = getFileStorage();
    const localPaths = new Map<string, string>();

    for (const row of rows) {
        if (row.sourcePath === null) {
            throw new MissingEditSourceError(row.id);
        }

        localPaths.set(row.id, await storage.getLocalFile(row.sourcePath, workDirectory));
    }

    return localPaths;
}

async function renderEdit(edit: Edit, workDirectory: string, signal: AbortSignal): Promise<string> {
    const { userId, videoId, format } = edit;

    if (format === "this-or-that") {
        const plan = contrastPlanSchema.parse(edit.plan);
        const localPaths = await prepareLocalVideos(userId, [videoId], workDirectory);
        const rawVideoPath = requireLocalVideo(localPaths, videoId);

        return await renderContrast({ plan, rawVideoPath, workDirectory, signal });
    }

    const plan = splitScreenPlanSchema.parse(edit.plan);
    const localPaths = await prepareLocalVideos(
        userId,
        [videoId, ...listSplitScreenSourceIds(plan)],
        workDirectory,
    );
    const rawVideoPath = requireLocalVideo(localPaths, videoId);
    const words = await findTranscriptWords(videoId);

    if (words === null) {
        throw new MissingEditSourceError(videoId);
    }

    return await renderSplitScreen({
        plan,
        words,
        rawVideoPath,
        examplePaths: localPaths,
        workDirectory,
        signal,
    });
}

function requireLocalVideo(localPaths: ReadonlyMap<string, string>, videoId: string): string {
    const localPath = localPaths.get(videoId);

    if (localPath === undefined) {
        throw new MissingEditSourceError(videoId);
    }

    return localPath;
}

async function renderAndStore(
    edit: Edit,
    workDirectory: string,
    signal: AbortSignal,
): Promise<void> {
    const outputPath = await renderEdit(edit, workDirectory, signal);
    // Inside the raw video's folder, so deleting the video takes its edits' files with it.
    const outputKey = `videos/${edit.videoId}/edits/${edit.id}.mp4`;
    const outputBytes = await getFileStorage().storeLocalFile(outputKey, outputPath, { signal });
    await db
        .update(edits)
        .set({ status: "done", outputPath: outputKey, outputBytes })
        .where(eq(edits.id, edit.id));
}

async function runClaimedEdit(edit: Edit): Promise<void> {
    const workDirectory = path.join(getEnvironment().WORK_DIR, EDITS_WORK_FOLDER, edit.id);
    const startedAt = performance.now();
    await mkdir(workDirectory, { recursive: true });

    try {
        await renderAndStore(edit, workDirectory, AbortSignal.timeout(RENDER_TIMEOUT_MS));
        logger.info({ durationMs: Math.round(performance.now() - startedAt) }, "Edit rendered");
    } catch (error) {
        logger.error({ error }, "Edit render failed");
        await db
            .update(edits)
            .set({ status: "failed", errorMessage: RENDER_FAILED_MESSAGE })
            .where(eq(edits.id, edit.id));
    } finally {
        await rm(workDirectory, { recursive: true, force: true });
    }
}

/** One render job: a failure is recorded on the edit, so the job itself completes. */
export async function runEditRender(payload: unknown): Promise<void> {
    const result = renderEditJobSchema.safeParse(payload);

    if (result.success === false) {
        throw new InvalidEditJobError(RENDER_EDIT_QUEUE);
    }

    const editId = result.data.editId;
    await withLogContext({ editId }, async () => {
        const edit = await claimEdit(editId);

        if (edit === null) {
            logger.warn("Edit render skipped: the edit is not waiting");
            return;
        }

        await runClaimedEdit(edit);
    });
}

/** Runs in the worker, which has ffmpeg and the work folder. */
export async function startEditRenderWorker(): Promise<void> {
    await ensureRenderEditQueue();
    const jobQueue = await getJobQueue();

    await jobQueue.work(RENDER_EDIT_QUEUE, async (jobs) => {
        for (const job of jobs) {
            await runEditRender(job.data);
        }
    });
}
