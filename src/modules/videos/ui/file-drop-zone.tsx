import UploadIcon from "~icons/solar/upload-linear";
import type { DragEvent } from "react";

interface FileDropZoneProps {
    onDragLeave: () => void;
    onDrop: (event: DragEvent<HTMLDivElement>) => void;
}

/** Takes over the field while a file is dragged over it, so the drop target is obvious. */
export function FileDropZone({ onDragLeave, onDrop }: FileDropZoneProps) {
    return (
        <div
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className="grid min-h-52 place-items-center content-center gap-2 rounded-2xl border border-dashed border-primary bg-primary/8 p-6 text-center"
        >
            <UploadIcon className="size-7" aria-hidden="true" />
            <p className="font-bold">Solte para enviar</p>
            <p className="text-sm text-muted-foreground">Um arquivo de vídeo por vez</p>
        </div>
    );
}
