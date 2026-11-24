import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import { videos } from "#/modules/video-records/video-records.schema";
import { measureFileBytes } from "#/shared/server/directory-size.server";
import { resolveStoragePath } from "#/shared/server/storage.server";
import { logger } from "#/shared/server/logger.server";

async function backfillSourceBytes(): Promise<number> {
    const missing = await db
        .select({ id: videos.id, sourcePath: videos.sourcePath })
        .from(videos)
        .where(and(isNotNull(videos.sourcePath), isNull(videos.sourceBytes)));

    for (const video of missing) {
        const sourcePath = video.sourcePath;

        if (sourcePath === null) {
            continue;
        }

        const sourceBytes = await measureFileBytes(resolveStoragePath(sourcePath));
        await db.update(videos).set({ sourceBytes }).where(eq(videos.id, video.id));
    }

    return missing.length;
}

async function backfillOutputBytes(): Promise<number> {
    const missing = await db
        .select({ id: clips.id, outputPath: clips.outputPath })
        .from(clips)
        .where(and(isNotNull(clips.outputPath), isNull(clips.outputBytes)));

    for (const clip of missing) {
        const outputPath = clip.outputPath;

        if (outputPath === null) {
            continue;
        }

        const outputBytes = await measureFileBytes(resolveStoragePath(outputPath));
        await db.update(clips).set({ outputBytes }).where(eq(clips.id, clip.id));
    }

    return missing.length;
}

/**
 * One-off for files saved before their sizes were stored (a migration cannot read the disk). New
 * files get their size when they are written, so after the first start this finds nothing.
 * A file that is gone counts as 0, which is what it takes on the disk.
 */
export async function backfillStoredBytes(): Promise<void> {
    const sourceCount = await backfillSourceBytes();
    const outputCount = await backfillOutputBytes();

    if (sourceCount + outputCount > 0) {
        logger.info("Stored file sizes backfilled", { sourceCount, outputCount });
    }
}
