import type { ReactNode } from "react";
import type { PendingUpload } from "#/modules/viral-formats/ui/hooks/use-batch-upload";
import { Progress } from "#/shared/ui/progress";

interface PendingUploadCardProps {
    upload: PendingUpload;
    onDismiss: () => void;
}

/** A file still on its way to storage, or the reason it did not get there. */
export function PendingUploadCard({ upload, onDismiss }: PendingUploadCardProps): ReactNode {
    const errorMessage = upload.errorMessage;

    return (
        <li className="grid content-start gap-2">
            <div className="grid aspect-clip-card place-items-center rounded-xl border border-dashed border-card-border p-4">
                {errorMessage === null && (
                    <div className="grid w-full gap-2 text-center">
                        <span className="text-sm font-bold tabular-nums">{upload.percent}%</span>
                        <Progress value={upload.percent} aria-label={`Enviando ${upload.name}`} />
                    </div>
                )}
                {errorMessage !== null && (
                    <p role="alert" className="text-center text-sm text-destructive">
                        {errorMessage}
                    </p>
                )}
            </div>
            <p className="truncate text-sm font-bold" title={upload.name}>
                {upload.name}
            </p>
            {errorMessage !== null && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="justify-self-start rounded-sm text-meta font-semibold underline underline-offset-4 outline-none focus-visible:ring-4 focus-visible:ring-ring"
                >
                    Dispensar
                </button>
            )}
        </li>
    );
}
