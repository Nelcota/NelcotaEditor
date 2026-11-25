import type { ReactNode } from "react";
import { EDIT_STATUS_LABELS } from "#/modules/viral-formats/model/edit-status";
import type { EditStatus } from "#/modules/viral-formats/model/edit-status";
import { toEditFileUrl } from "#/modules/viral-formats/model/edit-view";
import type { EditView } from "#/modules/viral-formats/model/edit-view";
import { DownloadLink } from "#/shared/ui/download-link";
import { formatDateTime } from "#/shared/ui/format";
import { StatusBadge } from "#/shared/ui/status-badge";
import type { StatusTone } from "#/shared/ui/status-badge";

const FORMAT_LABELS = { "split-screen": "Tela dividida" } as const;

const STATUS_TONES: Readonly<Record<EditStatus, StatusTone>> = {
    queued: "waiting",
    rendering: "working",
    done: "success",
    failed: "danger",
};

function EditRow({ edit }: { edit: EditView }): ReactNode {
    const fileUrl = toEditFileUrl(edit.id);

    return (
        <li className="grid gap-3 rounded-2xl border border-card-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="grid min-w-0 gap-1">
                <p className="font-bold [overflow-wrap:anywhere]">{edit.title}</p>
                <p className="text-meta text-muted-foreground">
                    {FORMAT_LABELS[edit.format]} · {formatDateTime(edit.createdAt)}
                </p>
                {edit.errorMessage !== null && (
                    <p className="text-meta text-destructive">{edit.errorMessage}</p>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                    tone={STATUS_TONES[edit.status]}
                    label={EDIT_STATUS_LABELS[edit.status]}
                />
                {edit.status === "done" && (
                    <>
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-sm text-sm font-semibold underline decoration-primary-ink/40 underline-offset-4 outline-none hover:decoration-primary-ink focus-visible:ring-4 focus-visible:ring-ring"
                        >
                            Assistir
                        </a>
                        <DownloadLink href={`${fileUrl}?download=1`} label="Baixar" />
                    </>
                )}
            </div>
        </li>
    );
}

/** The person's edits, newest first, each with its state and, once done, the file. */
export function EditList({ edits }: { edits: ReadonlyArray<EditView> }): ReactNode {
    return (
        <ul className="grid gap-3">
            {edits.map((edit) => (
                <EditRow key={edit.id} edit={edit} />
            ))}
        </ul>
    );
}
