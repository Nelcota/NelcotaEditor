import UploadIcon from "~icons/lucide/upload";
import type { DragEvent } from "react";

interface FileDropZoneProps {
    onDragLeave: () => void;
    onDrop: (event: DragEvent<HTMLDivElement>) => void;
}

/** Takes over the field while a file is dragged over it, so the drop target is obvious. */
export function FileDropZone({ onDragLeave, onDrop }: FileDropZoneProps) {
    const leaveZone = (event: DragEvent<HTMLDivElement>): void => {
        const enteredElement = event.relatedTarget;

        // Moving onto the icon or the text fires a leave too; the file is still over the zone.
        if (enteredElement instanceof Node && event.currentTarget.contains(enteredElement)) {
            return;
        }

        onDragLeave();
    };

    return (
        <div
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={leaveZone}
            onDrop={onDrop}
            className="grid min-h-52 place-items-center content-center gap-2 rounded-2xl border border-dashed border-primary bg-primary/8 p-6 text-center"
        >
            <UploadIcon className="size-7" aria-hidden="true" />
            <p className="font-semibold">Solte para enviar</p>
            <p className="text-sm text-muted-foreground">Um arquivo de vídeo por vez</p>
        </div>
    );
}
