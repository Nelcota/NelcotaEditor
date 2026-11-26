import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import {
    createEditSessionInputSchema,
    editSessionIdInputSchema,
    queueEditSessionInputSchema,
    sessionNoteInputSchema,
    sessionVideoInputSchema,
} from "#/modules/viral-formats/model/edit-session";
import type {
    EditSessionSummary,
    EditSessionView,
} from "#/modules/viral-formats/model/edit-session";
import {
    addSessionNote,
    addSessionVideo,
    createEditSession,
    queueEditSession,
} from "#/modules/viral-formats/server/edit-session-commands.server";
import {
    findUserEditSession,
    listUserEditSessions,
} from "#/modules/viral-formats/server/edit-session-queries.server";

export const createMyEditSession = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(createEditSessionInputSchema)
    .handler(async ({ context, data }): Promise<{ sessionId: string }> => ({
        sessionId: await createEditSession(context.user.id, data.format),
    }));

export const listMyEditSessions = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<Array<EditSessionSummary>> =>
        listUserEditSessions(context.user.id),
    );

/** Null for a missing batch and for another person's: the route answers both with a 404. */
export const getMyEditSession = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(editSessionIdInputSchema)
    .handler(async ({ context, data }): Promise<EditSessionView | null> =>
        findUserEditSession(context.user.id, data.sessionId),
    );

export const addVideoToMyEditSession = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(sessionVideoInputSchema)
    .handler(async ({ context, data }): Promise<void> => addSessionVideo(context.user.id, data));

export const addNoteToMyEditSession = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(sessionNoteInputSchema)
    .handler(async ({ context, data }): Promise<void> => addSessionNote(context.user.id, data));

export const queueMyEditSession = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(queueEditSessionInputSchema)
    .handler(async ({ context, data }): Promise<void> =>
        queueEditSession(context.user.id, data.sessionId, data.adjustment),
    );
