import XIcon from "~icons/lucide/x";
import type { ReactNode } from "react";
import type { SessionVideo } from "#/modules/viral-formats/model/edit-session";
import { EDIT_STATUS_LABELS } from "#/modules/viral-formats/model/edit-status";
import type { EditView } from "#/modules/viral-formats/model/edit-view";
import { toEditFileUrl } from "#/modules/viral-formats/model/edit-view";
import { formatBytes } from "#/shared/ui/format";

interface SessionVideoCardProps {
    video: SessionVideo;
    /** The edit Claude made of it, once there is one. */
    edit: EditView | undefined;
    /** Only while the batch is open; null hides the button. */
    onRemove: (() => void) | null;
    isRemoving: boolean;
}

function describePreparation(video: SessionVideo): string {
    if (video.hasFailed === true) {
        return "Não deu para preparar este vídeo";
    }

    if (video.isReady === false) {
        return `Preparando · ${video.progressPercent}%`;
    }

    if (video.sourceBytes === null) {
        return "Pronto para editar";
    }

    return formatBytes(video.sourceBytes);
}

function EditState({ edit }: { edit: EditView }): ReactNode {
    if (edit.status !== "done") {
        return (
            <span className="text-meta text-muted-foreground">
                {EDIT_STATUS_LABELS[edit.status]}
            </span>
        );
    }

    return (
        <a
            href={toEditFileUrl(edit.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm text-meta font-semibold text-primary-ink underline underline-offset-4 outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
            Assistir a edição
        </a>
    );
}

/** One raw video of the batch: its frame, name, how its preparation goes and, later, its edit. */
export function SessionVideoCard({
    video,
    edit,
    onRemove,
    isRemoving,
}: SessionVideoCardProps): ReactNode {
    return (
        <li className="relative grid content-start gap-2">
            <div className="aspect-clip-card overflow-hidden rounded-xl bg-stage">
                {video.thumbnailUrl !== null && (
                    <img
                        src={video.thumbnailUrl}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                    />
                )}
            </div>
            <div className="grid min-w-0 gap-0.5">
                <p className="truncate text-sm font-bold" title={video.title}>
                    {video.title}
                </p>
                <p className="text-meta text-muted-foreground tabular-nums">
                    {describePreparation(video)}
                </p>
                {edit !== undefined && <EditState edit={edit} />}
            </div>
            {onRemove !== null && (
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={isRemoving}
                    aria-busy={isRemoving}
                    aria-label={`Tirar ${video.title} da edição`}
                    className="absolute end-2 top-2 grid size-8 place-items-center rounded-full bg-stage/80 text-white outline-none transition-[background-color,scale] hover:bg-stage focus-visible:ring-4 focus-visible:ring-ring motion-safe:enabled:active:scale-99"
                >
                    <XIcon aria-hidden="true" className="size-4" />
                </button>
            )}
        </li>
    );
}
