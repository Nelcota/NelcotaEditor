import type { EditFormat, EditStatus } from "#/modules/viral-formats/model/edit-status";

/** An edit as Minhas edições and the person's Claude see it; dates cross as ISO strings. */
export interface EditView {
    id: string;
    title: string;
    format: EditFormat;
    status: EditStatus;
    errorMessage: string | null;
    createdAt: string;
}

/** Where the finished file is served to its owner; ?download=1 saves it instead of playing it. */
export function toEditFileUrl(editId: string): string {
    if (editId.trim().length === 0) {
        throw new Error("An edit file URL needs the edit's id");
    }

    return `/api/edits/${editId}/file`;
}

/** Minhas edições shows the latest ones; older edits stay in storage until their video goes. */
export const MAX_LISTED_EDITS = 50;
