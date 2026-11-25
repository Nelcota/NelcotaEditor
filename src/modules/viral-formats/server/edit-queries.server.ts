import { and, desc, eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { MAX_LISTED_EDITS } from "#/modules/viral-formats/model/edit-view";
import type { EditView } from "#/modules/viral-formats/model/edit-view";
import { edits } from "#/modules/viral-formats/viral-formats.schema";

const EDIT_VIEW_COLUMNS = {
    id: edits.id,
    title: edits.title,
    format: edits.format,
    status: edits.status,
    errorMessage: edits.errorMessage,
    createdAt: edits.createdAt,
};

type EditViewRow = Omit<EditView, "createdAt"> & { createdAt: Date };

function toEditView(row: EditViewRow): EditView {
    return { ...row, createdAt: row.createdAt.toISOString() };
}

/** The person's latest edits, newest first. */
export async function listUserEdits(userId: string): Promise<Array<EditView>> {
    const rows = await db
        .select(EDIT_VIEW_COLUMNS)
        .from(edits)
        .where(eq(edits.userId, userId))
        .orderBy(desc(edits.createdAt))
        .limit(MAX_LISTED_EDITS);

    return rows.map(toEditView);
}

/** Another person's edit and a missing one answer the same: null. */
export async function findUserEdit(userId: string, editId: string): Promise<EditView | null> {
    const rows = await db
        .select(EDIT_VIEW_COLUMNS)
        .from(edits)
        .where(and(eq(edits.id, editId), eq(edits.userId, userId)))
        .limit(1);
    const row = rows[0];

    if (row === undefined) {
        return null;
    }

    return toEditView(row);
}

/** The stored file of a finished edit of the person's, for the download route. */
export async function findUserEditFile(
    userId: string,
    editId: string,
): Promise<{ title: string; outputPath: string } | null> {
    const rows = await db
        .select({ title: edits.title, outputPath: edits.outputPath })
        .from(edits)
        .where(and(eq(edits.id, editId), eq(edits.userId, userId), eq(edits.status, "done")))
        .limit(1);
    const row = rows[0];

    if (row === undefined || row.outputPath === null) {
        return null;
    }

    return { title: row.title, outputPath: row.outputPath };
}
