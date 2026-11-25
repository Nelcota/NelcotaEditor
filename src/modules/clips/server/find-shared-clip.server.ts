import { and, eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { isAppSwitchEnabled } from "#/modules/app-switches/server/app-switches.server";
import { clips } from "#/modules/clips/clips.schema";
import type { AspectRatio } from "#/modules/clips/model/clip-format";
import { shareTokenSchema } from "#/modules/clips/model/shared-clip";

const SHARED_CLIP_COLUMNS = {
    title: clips.title,
    aspectRatio: clips.aspectRatio,
    startSeconds: clips.startSeconds,
    endSeconds: clips.endSeconds,
    outputPath: clips.outputPath,
    posterPath: clips.posterPath,
};

interface SharedClipRow {
    title: string;
    aspectRatio: AspectRatio;
    startSeconds: number;
    endSeconds: number;
    outputPath: string;
    posterPath: string | null;
}

/**
 * The ready clip behind a public link, or null when the token is malformed or unknown, the clip
 * is rendering again, or sharing is paused: paused sharing stops the links already sent too.
 */
export async function findSharedClip(token: string): Promise<SharedClipRow | null> {
    if (shareTokenSchema.safeParse(token).success === false) {
        return null;
    }

    if ((await isAppSwitchEnabled("clip-sharing")) === false) {
        return null;
    }

    const rows = await db
        .select(SHARED_CLIP_COLUMNS)
        .from(clips)
        .where(and(eq(clips.shareToken, token), eq(clips.status, "done")))
        .limit(1);
    const row = rows[0];

    if (row === undefined || row.outputPath === null) {
        return null;
    }

    return { ...row, outputPath: row.outputPath };
}
