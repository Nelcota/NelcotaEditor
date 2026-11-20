import type { ReactNode } from "react";
import { Progress } from "#/shared/ui/progress";

/** Only while a file is going up; null means nothing is uploading. */
export function UploadProgress({ percent }: { percent: number | null }): ReactNode {
    if (percent === null) {
        return null;
    }

    return (
        <div className="grid gap-2" aria-live="polite">
            <div className="flex justify-between gap-3 text-sm">
                <span className="font-medium">Enviando… mantenha esta janela aberta</span>
                <span className="text-muted-foreground tabular-nums">{percent}%</span>
            </div>
            <Progress value={percent} aria-label="Progresso do envio" />
        </div>
    );
}
