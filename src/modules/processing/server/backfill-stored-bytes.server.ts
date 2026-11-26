import { and, asc, eq, gt, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import { videos } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getJobQueue } from "#/shared/server/job-queue.server";
import { logger } from "#/shared/server/logger.server";
import { runWithConcurrency } from "#/shared/server/run-with-concurrency.server";

const STORED_BYTES_QUEUE = "backfill-stored-bytes";
const EVERY_FIVE_MINUTES = "*/5 * * * *";
const PAGE_SIZE = 100;
const MEASUREMENT_CONCURRENCY = 4;

interface UnmeasuredFiles {
    id: string;
    path: string | null;
    previewPath: string | null;
}

async function listUnmeasuredSources(afterId: string | null): Promise<Array<UnmeasuredFiles>> {
    let after;

    if (afterId !== null) {
        after = gt(videos.id, afterId);
    }

    return db
        .select({ id: videos.id, path: videos.sourcePath, previewPath: videos.thumbnailPath })
        .from(videos)
        .where(
            and(
                isNull(videos.sourceBytes),
                or(isNotNull(videos.sourcePath), isNotNull(videos.thumbnailPath)),
                after,
            ),
        )
        .orderBy(asc(videos.id))
        .limit(PAGE_SIZE);
}

async function listUnmeasuredClips(afterId: string | null): Promise<Array<UnmeasuredFiles>> {
    let after;

    if (afterId !== null) {
        after = gt(clips.id, afterId);
    }

    return db
        .select({ id: clips.id, path: clips.outputPath, previewPath: clips.posterPath })
        .from(clips)
        .where(
            and(
                isNull(clips.outputBytes),
                or(isNotNull(clips.outputPath), isNotNull(clips.posterPath)),
                after,
            ),
        )
        .orderBy(asc(clips.id))
        .limit(PAGE_SIZE);
}

async function measureBytes(files: UnmeasuredFiles): Promise<number | null> {
    const { id, path, previewPath } = files;
    const storage = getFileStorage();
    const storedPaths = [path, previewPath].filter((filePath) => filePath !== null);
    let bytes = 0;

    try {
        for (const filePath of storedPaths) {
            bytes += await storage.measureFile(filePath);
        }
    } catch (error) {
        logger.warn({ mediaId: id, error }, "Could not measure stored files");
        return null;
    }

    return bytes;
}

async function recordSourceBytes(files: UnmeasuredFiles, sourceBytes: number): Promise<void> {
    const { id, path, previewPath } = files;
    await db
        .update(videos)
        .set({ sourceBytes })
        .where(
            and(
                eq(videos.id, id),
                isNull(videos.sourceBytes),
                sql`${videos.sourcePath} is not distinct from ${path}`,
                sql`${videos.thumbnailPath} is not distinct from ${previewPath}`,
            ),
        );
}

async function recordClipBytes(files: UnmeasuredFiles, outputBytes: number): Promise<void> {
    const { id, path, previewPath } = files;
    await db
        .update(clips)
        .set({ outputBytes })
        .where(
            and(
                eq(clips.id, id),
                isNull(clips.outputBytes),
                sql`${clips.outputPath} is not distinct from ${path}`,
                sql`${clips.posterPath} is not distinct from ${previewPath}`,
            ),
        );
}

async function backfillFiles(
    listFiles: (afterId: string | null) => Promise<Array<UnmeasuredFiles>>,
    recordBytes: (files: UnmeasuredFiles, bytes: number) => Promise<void>,
): Promise<void> {
    let afterId: string | null = null;

    for (;;) {
        const files = await listFiles(afterId);
        const lastFile = files.at(-1);

        if (lastFile === undefined) {
            return;
        }

        await runWithConcurrency(files, MEASUREMENT_CONCURRENCY, async (file): Promise<void> => {
            const bytes = await measureBytes(file);

            if (bytes !== null) {
                await recordBytes(file, bytes);
            }
        });

        afterId = lastFile.id;
    }
}

/** Missing files take zero bytes. Failed measurements stay pending for the next sweep. */
export async function backfillStoredBytes(): Promise<void> {
    await backfillFiles(listUnmeasuredSources, recordSourceBytes);
    await backfillFiles(listUnmeasuredClips, recordClipBytes);
}

/** Start the sweep as a job so slow storage does not delay the worker's startup. */
export async function startStoredBytesBackfill(): Promise<void> {
    const jobQueue = await getJobQueue();
    await jobQueue.createQueue(STORED_BYTES_QUEUE, { policy: "exclusive", retryLimit: 0 });
    await jobQueue.schedule(STORED_BYTES_QUEUE, EVERY_FIVE_MINUTES);
    await jobQueue.work(STORED_BYTES_QUEUE, backfillStoredBytes);
    await jobQueue.send(STORED_BYTES_QUEUE);
}
