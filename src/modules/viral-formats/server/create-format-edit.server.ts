import { and, eq, inArray, ne } from "drizzle-orm";
import { fromDrizzle } from "pg-boss";
import { sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { findTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import { videos } from "#/modules/video-records/video-records.schema";
import type { ContrastPlan } from "#/modules/viral-formats/model/contrast-plan";
import { InvalidEditPlanError } from "#/modules/viral-formats/model/edit-errors";
import type { GamifiedPlan } from "#/modules/viral-formats/model/gamified-plan";
import type { PresenterPlan } from "#/modules/viral-formats/model/presenter-plan";
import { listSplitScreenSourceIds } from "#/modules/viral-formats/model/split-screen-plan";
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

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type FormatEditRequest =
    | { format: "split-screen"; plan: SplitScreenPlan }
    | { format: "this-or-that"; plan: ContrastPlan }
    | { format: "generic"; plan: GamifiedPlan };

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

function assertTakesInside(plan: PresenterPlan, durationSeconds: number): void {
    const lateTake = plan.takes.find(
        (take) =>
            take.start >= durationSeconds ||
            take.end > durationSeconds + DURATION_TOLERANCE_SECONDS,
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

/** A batch lock serializes repeated requests for the same queued video. */
async function findQueuedSessionEdit(
    transaction: Transaction,
    userId: string,
    request: FormatEditRequest,
): Promise<string | null> {
    const { format, plan } = request;
    const { sessionId, videoId } = plan;

    if (sessionId === undefined) {
        return null;
    }

    const [session] = await transaction
        .select({ status: editSessions.status, format: editSessions.format })
        .from(editSessions)
        .innerJoin(editSessionVideos, eq(editSessionVideos.sessionId, editSessions.id))
        .where(
            and(
                eq(editSessions.id, sessionId),
                eq(editSessions.userId, userId),
                eq(editSessionVideos.videoId, videoId),
            ),
        )
        .for("update", { of: editSessions });

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

    if (session.format !== format) {
        throw new InvalidEditPlanError(
            "This tool does not match the batch's format. Use the format from list_edit_queue.",
        );
    }

    const [existing] = await transaction
        .select({ id: edits.id })
        .from(edits)
        .where(
            and(
                eq(edits.userId, userId),
                eq(edits.sessionId, sessionId),
                eq(edits.videoId, videoId),
                eq(edits.format, format),
                ne(edits.status, "failed"),
            ),
        )
        .limit(1);

    return existing?.id ?? null;
}

async function assertPlanReady(userId: string, request: FormatEditRequest): Promise<void> {
    const { format, plan } = request;
    const videoIds = [plan.videoId];

    if (format === "split-screen") {
        videoIds.push(...listSplitScreenSourceIds(plan));
    }

    const planVideos = await findPlanVideos(userId, videoIds);
    const rawVideo = requireUsableVideo(planVideos, plan.videoId);
    assertTakesInside(plan, rawVideo.durationSeconds);
    if (format === "split-screen") {
        assertExamplesInside(plan, planVideos);
    }

    if ((await findTranscriptWords(plan.videoId)) === null) {
        throw new InvalidEditPlanError(
            "This video has no transcript yet. Try again once it is processed.",
        );
    }
}

export async function createFormatEdit(
    userId: string,
    request: FormatEditRequest,
): Promise<string> {
    const { format, plan } = request;

    if (userId.trim().length === 0) {
        throw new RangeError("An edit needs the signed-in person's id");
    }

    await assertFormatAvailable(userId, format);
    await assertPlanReady(userId, request);

    return await db.transaction(async (transaction) => {
        const existingId = await findQueuedSessionEdit(transaction, userId, request);

        if (existingId !== null) {
            return existingId;
        }

        const inserted = await transaction
            .insert(edits)
            .values({
                userId,
                videoId: plan.videoId,
                sessionId: plan.sessionId ?? null,
                title: plan.title,
                format,
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
