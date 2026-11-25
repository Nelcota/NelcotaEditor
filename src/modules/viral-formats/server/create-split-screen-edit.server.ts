import { and, eq, inArray } from "drizzle-orm";
import { fromDrizzle } from "pg-boss";
import { sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { findTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { InvalidEditPlanError } from "#/modules/viral-formats/model/edit-errors";
import type { SplitScreenPlan } from "#/modules/viral-formats/model/split-screen-plan";
import { assertFormatAvailable } from "#/modules/viral-formats/server/assert-format-available.server";
import { enqueueEditRender } from "#/modules/viral-formats/server/edit-render-queue.server";
import {
    editSessionVideos,
    editSessions,
    edits,
} from "#/modules/viral-formats/viral-formats.schema";

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

/** A plan from the queue must name one of the person's queued batches and a video in it. */
async function assertVideoInQueuedSession(userId: string, plan: SplitScreenPlan): Promise<void> {
    const sessionId = plan.sessionId;

    if (sessionId === undefined) {
        return;
    }

    const rows = await db
        .select({ status: editSessions.status })
        .from(editSessions)
        .innerJoin(editSessionVideos, eq(editSessionVideos.sessionId, editSessions.id))
        .where(
            and(
                eq(editSessions.id, sessionId),
                eq(editSessions.userId, userId),
                eq(editSessionVideos.videoId, plan.videoId),
            ),
        )
        .limit(1);
    const session = rows[0];

    if (session === undefined) {
        throw new InvalidEditPlanError(
            "That video is not in that batch. Use the ids from list_edit_queue.",
        );
    }

    if (session.status !== "queued") {
        throw new InvalidEditPlanError(
            "The person has not sent that batch to edit yet. Ask them to click Começar a editar.",
        );
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
    await assertFormatAvailable(userId, "split-screen");
    const sourceIds = plan.panels
        .filter((panel) => panel.kind === "example")
        .map((panel) => panel.sourceVideoId);
    const planVideos = await findPlanVideos(userId, [plan.videoId, ...sourceIds]);
    const rawVideo = requireUsableVideo(planVideos, plan.videoId);
    assertTakesInside(plan, rawVideo.durationSeconds);
    assertExamplesInside(plan, planVideos);
    await assertVideoInQueuedSession(userId, plan);

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
                sessionId: plan.sessionId ?? null,
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
