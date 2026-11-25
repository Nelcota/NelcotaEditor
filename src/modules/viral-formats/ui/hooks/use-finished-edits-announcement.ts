import { useState } from "react";
import type { EditStatus } from "#/modules/viral-formats/model/edit-status";
import type { EditView } from "#/modules/viral-formats/model/edit-view";

type StatusById = ReadonlyMap<string, EditStatus>;

const WORKING_STATUSES: ReadonlySet<EditStatus> = new Set(["queued", "rendering"]);
const FINISHED_MESSAGES: Partial<Record<EditStatus, (title: string) => string>> = {
    done: (title) => `${title} está pronta.`,
    failed: (title) => `${title} não deu certo.`,
};

function toStatusById(edits: ReadonlyArray<EditView>): StatusById {
    return new Map(edits.map((edit) => [edit.id, edit.status]));
}

function hasSameStatuses(previous: StatusById, current: StatusById): boolean {
    if (previous.size !== current.size) {
        return false;
    }

    return [...current].every(([editId, status]) => previous.get(editId) === status);
}

/** One sentence per edit that left the queue since the last check, in list order. */
function describeFinished(previous: StatusById, edits: ReadonlyArray<EditView>): string {
    return edits
        .filter((edit) => WORKING_STATUSES.has(previous.get(edit.id) ?? "done"))
        .map((edit) => FINISHED_MESSAGES[edit.status]?.(edit.title) ?? "")
        .filter((message) => message.length > 0)
        .join(" ");
}

/**
 * What a screen reader hears when an edit finishes while Minhas edições is open. The list only
 * polls, so a badge turning to Pronta would otherwise change in silence.
 */
export function useFinishedEditsAnnouncement(edits: ReadonlyArray<EditView> | undefined): string {
    const [previous, setPrevious] = useState<StatusById | null>(null);
    const [announcement, setAnnouncement] = useState("");

    if (edits === undefined) {
        return announcement;
    }

    const current = toStatusById(edits);

    // Stored during render, as React advises for state that follows earlier renders.
    if (previous === null || hasSameStatuses(previous, current) === false) {
        setPrevious(current);
    }

    if (previous !== null && hasSameStatuses(previous, current) === false) {
        const finished = describeFinished(previous, edits);

        if (finished.length > 0) {
            setAnnouncement(finished);
        }
    }

    return announcement;
}
