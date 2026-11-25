import { and, eq, inArray } from "drizzle-orm";
import { fromDrizzle } from "pg-boss";
import { sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { findTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { InvalidEditPlanError } from "#/modules/viral-formats/model/edit-errors";
import type { SplitScreenPlan } from "#/modules/viral-formats/model/split-screen-plan";
import { enqueueEditRender } from "#/modules/viral-formats/server/edit-render-queue.server";
import { edits } from "#/modules/viral-formats/viral-formats.schema";

/** Transcripts round times; a take may end a hair past the measured duration. */
const DURATION_TOLERANCE_SECONDS = 0.05;

interface PlanVideo {
    id: string;
    sourcePath: string | null;
    durationSeconds: number | null;
}

/** The plan's videos that belong to the person; another person's video is simply missing. */
async function findPlanVideos(
    userId: string,
    videoIds: Array<string>,
): Promise<Map<string, PlanVideo>> {
    const rows = await db
        .select({
            id: videos.id,
            sourcePath: videos.sourcePath,
            durationSeconds: videos.durationSeconds,
        })
        .from(videos)
        .where(and(eq(videos.userId, userId), inArray(videos.id, videoIds)));

    return new Map(rows.map((row) => [row.id, row]));
}

function requireUsableVideo(
    planVideos: Map<string, PlanVideo>,
    videoId: string,
): PlanVideo & { durationSeconds: number } {
    const video = planVideos.get(videoId);

    if (video === undefined) {
        throw new InvalidEditPlanError(`Video ${videoId} was not found.`);
    }

    if (video.sourcePath === null || video.durationSeconds === null) {
        throw new InvalidEditPlanError(
            `Video ${videoId} is not ready yet. Try again once it is processed.`,
        );
    }

    return { ...video, durationSeconds: video.durationSeconds };
}

function assertTakesInside(plan: SplitScreenPlan, durationSeconds: number): void {
    const lateTake = plan.takes.find(
        (take) => take.end > durationSeconds + DURATION_TOLERANCE_SECONDS,
    );

    if (lateTake !== undefined) {
        throw new InvalidEditPlanError(
            `A take ends at ${lateTake.end}s, after the video ends at ${durationSeconds.toFixed(2)}s.`,
        );
    }
}

function assertExamplesInside(plan: SplitScreenPlan, planVideos: Map<string, PlanVideo>): void {
    for (const panel of plan.panels) {
        if (panel.kind !== "example") {
            continue;
        }

        const source = requireUsableVideo(planVideos, panel.sourceVideoId);

        if (panel.sourceStart >= source.durationSeconds) {
            throw new InvalidEditPlanError(
                `A panel starts video ${panel.sourceVideoId} at ${panel.sourceStart}s, after it ends.`,
            );
        }
    }
}

/**
 * Checks a Tela dividida plan against the person's own videos and queues its render. The raw
 * video needs its transcript, since the captions come from it.
 */
export async function createSplitScreenEdit(
    userId: string,
    plan: SplitScreenPlan,
): Promise<string> {
    const sourceIds = plan.panels
        .filter((panel) => panel.kind === "example")
        .map((panel) => panel.sourceVideoId);
    const planVideos = await findPlanVideos(userId, [plan.videoId, ...sourceIds]);
    const rawVideo = requireUsableVideo(planVideos, plan.videoId);
    assertTakesInside(plan, rawVideo.durationSeconds);
    assertExamplesInside(plan, planVideos);

    if ((await findTranscriptWords(plan.videoId)) === null) {
        throw new InvalidEditPlanError(
            "This video has no transcript yet. Try again once it is processed.",
        );
    }

    return await db.transaction(async (transaction) => {
        const inserted = await transaction
            .insert(edits)
            .values({
                userId,
                videoId: plan.videoId,
                title: plan.title,
                format: "split-screen",
                plan,
            })
            .returning({ id: edits.id });
        const editId = inserted[0]?.id;

        if (editId === undefined) {
            throw new Error("Inserting an edit returned no row");
        }

        await enqueueEditRender(editId, fromDrizzle(transaction, sql));
        return editId;
    });
}
