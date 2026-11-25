import { and, count, eq, max, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { MAX_SESSION_NOTES, MAX_SESSION_VIDEOS } from "#/modules/viral-formats/model/edit-session";
import type { EditFormat } from "#/modules/viral-formats/model/edit-status";
import {
    editSessionNotes,
    editSessionVideos,
    editSessions,
} from "#/modules/viral-formats/viral-formats.schema";
import { logger } from "#/shared/server/logger.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class EditSessionNotFoundError extends UserFacingError {
    constructor() {
        super("Esta edição não existe mais.");
        this.name = "EditSessionNotFoundError";
    }
}

export class EditSessionLockedError extends UserFacingError {
    constructor() {
        super("Esta edição já foi para o Claude. Crie outra para mandar mais vídeos.");
        this.name = "EditSessionLockedError";
    }
}

export class EditSessionFullError extends UserFacingError {
    constructor() {
        super(`Cada edição leva até ${MAX_SESSION_VIDEOS} vídeos. Crie outra para os próximos.`);
        this.name = "EditSessionFullError";
    }
}

export class EditSessionVideoUnusableError extends UserFacingError {
    constructor() {
        super("Este vídeo não pode entrar nesta edição. Envie o arquivo de novo.");
        this.name = "EditSessionVideoUnusableError";
    }
}

export class EditSessionNotesFullError extends UserFacingError {
    constructor() {
        super(`Esta edição já tem ${MAX_SESSION_NOTES} ajustes. Junte os pedidos em uma mensagem.`);
        this.name = "EditSessionNotesFullError";
    }
}

export class EditSessionEmptyError extends UserFacingError {
    constructor() {
        super("Envie pelo menos um vídeo antes de começar a editar.");
        this.name = "EditSessionEmptyError";
    }
}

interface SessionVideoInput {
    sessionId: string;
    videoId: string;
}

/**
 * Runs a change on the person's batch while it is still open, holding its row so two requests
 * (parallel uploads, a double click) cannot both pass a limit. Another person's batch reads as
 * missing.
 */
async function withOpenSession<T>(
    userId: string,
    sessionId: string,
    change: (transaction: Transaction) => Promise<T>,
): Promise<T> {
    return await db.transaction(async (transaction) => {
        const [session] = await transaction
            .select({ status: editSessions.status })
            .from(editSessions)
            .where(and(eq(editSessions.id, sessionId), eq(editSessions.userId, userId)))
            .for("update");

        if (session === undefined) {
            throw new EditSessionNotFoundError();
        }

        if (session.status !== "collecting") {
            throw new EditSessionLockedError();
        }

        return await change(transaction);
    });
}

async function countSessionVideos(transaction: Transaction, sessionId: string): Promise<number> {
    const [row] = await transaction
        .select({ total: count() })
        .from(editSessionVideos)
        .where(eq(editSessionVideos.sessionId, sessionId));

    return row?.total ?? 0;
}

/**
 * Opens the person's next batch in a format and returns its id. The number counts their batches
 * in that format, taken under a per-person lock so two clicks never get the same one.
 */
export async function createEditSession(userId: string, format: EditFormat): Promise<string> {
    if (userId.trim().length === 0) {
        throw new RangeError("An edit session needs the signed-in person's id");
    }

    const sessionId = await db.transaction(async (transaction) => {
        await transaction.execute(
            sql`select pg_advisory_xact_lock(hashtext(${`edit-sessions:${userId}`}))`,
        );
        const [latest] = await transaction
            .select({ number: max(editSessions.number) })
            .from(editSessions)
            .where(and(eq(editSessions.userId, userId), eq(editSessions.format, format)));
        const [created] = await transaction
            .insert(editSessions)
            .values({ userId, format, number: (latest?.number ?? 0) + 1 })
            .returning({ id: editSessions.id });

        if (created === undefined) {
            throw new Error("Insert of an edit session returned no row");
        }

        return created.id;
    });
    logger.info({ userId, sessionId, format }, "edit session opened");
    return sessionId;
}

/** Puts one of the person's raw format videos into their open batch. */
export async function addSessionVideo(userId: string, input: SessionVideoInput): Promise<void> {
    const { sessionId, videoId } = input;
    await withOpenSession(userId, sessionId, async (transaction) => {
        const [video] = await transaction
            .select({ purpose: videos.purpose })
            .from(videos)
            .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

        // Another person's video and a clips video answer the same.
        if (video === undefined || video.purpose !== "format") {
            throw new EditSessionVideoUnusableError();
        }

        if ((await countSessionVideos(transaction, sessionId)) >= MAX_SESSION_VIDEOS) {
            throw new EditSessionFullError();
        }

        // A video already in this batch (a retried request) stays as it is.
        await transaction
            .insert(editSessionVideos)
            .values({ sessionId, videoId })
            .onConflictDoNothing();
    });
}

/** Takes a raw video out of the person's open batch; the caller deletes the video itself. */
export async function removeSessionVideo(userId: string, input: SessionVideoInput): Promise<void> {
    const { sessionId, videoId } = input;
    await withOpenSession(userId, sessionId, async (transaction) => {
        await transaction
            .delete(editSessionVideos)
            .where(
                and(
                    eq(editSessionVideos.sessionId, sessionId),
                    eq(editSessionVideos.videoId, videoId),
                ),
            );
    });
}

/** Saves one adjustment the person wants in every video of the batch. */
export async function addSessionNote(
    userId: string,
    input: { sessionId: string; body: string },
): Promise<void> {
    const { sessionId, body } = input;
    await withOpenSession(userId, sessionId, async (transaction) => {
        const [noteCount] = await transaction
            .select({ total: count() })
            .from(editSessionNotes)
            .where(eq(editSessionNotes.sessionId, sessionId));

        if ((noteCount?.total ?? 0) >= MAX_SESSION_NOTES) {
            throw new EditSessionNotesFullError();
        }

        await transaction.insert(editSessionNotes).values({ sessionId, body });
    });
}

/** Closes the batch for changes and puts it in the queue the person's Claude reads. */
export async function queueEditSession(userId: string, sessionId: string): Promise<void> {
    await withOpenSession(userId, sessionId, async (transaction) => {
        if ((await countSessionVideos(transaction, sessionId)) === 0) {
            throw new EditSessionEmptyError();
        }

        await transaction
            .update(editSessions)
            .set({ status: "queued" })
            .where(eq(editSessions.id, sessionId));
    });
    logger.info({ userId, sessionId }, "edit session queued for claude");
}
