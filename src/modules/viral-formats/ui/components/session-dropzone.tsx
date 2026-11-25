import UploadIcon from "~icons/lucide/upload";
import { useId } from "react";
import type { ReactNode } from "react";
import { MAX_SESSION_VIDEOS } from "#/modules/viral-formats/model/edit-session";
import { cn } from "#/shared/ui/cn";

const ACCEPTED_TYPES = "video/mp4,video/quicktime,video/webm,video/x-matroska,.mov,.mkv,.m4v";

interface SessionDropzoneProps {
    onFiles: (files: Array<File>) => void;
    /** The big empty-state box, or the small "Adicionar mais" tile beside the videos. */
    variant: "empty" | "tile";
}

/**
 * Where raw videos come in. The file input itself covers the box, invisible: a click opens the
 * picker for one or many files, and files dropped on it fill it natively, with no drag handlers.
 */
export function SessionDropzone({ onFiles, variant }: SessionDropzoneProps): ReactNode {
    const inputId = useId();

    return (
        <div
            className={cn(
                "relative grid place-items-center gap-3 rounded-2xl border-2 border-dashed border-card-border text-center transition-[border-color,background-color] has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-ring has-[input:hover]:border-primary-ink/60 has-[input:hover]:bg-primary/5",
                variant === "empty" && "px-6 py-12",
                variant === "tile" && "aspect-clip-card p-4",
            )}
        >
            <span className="grid size-14 place-items-center rounded-xl bg-primary-solid text-primary-foreground">
                <UploadIcon aria-hidden="true" className="size-6" />
            </span>
            {variant === "empty" && (
                <span className="grid max-w-md gap-1.5">
                    <label htmlFor={inputId} className="text-lg font-bold">
                        Suba seus vídeos brutos
                    </label>
                    <span className="text-sm text-muted-foreground">
                        Escolha um ou vários de uma vez (até {MAX_SESSION_VIDEOS}). Arraste os
                        arquivos aqui ou clique para escolher. MP4, MOV ou WEBM, na vertical (9:16).
                    </span>
                </span>
            )}
            {variant === "tile" && (
                <label htmlFor={inputId} className="font-bold">
                    Adicionar mais
                </label>
            )}
            <input
                id={inputId}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                onChange={(event) => {
                    const input = event.currentTarget;
                    onFiles([...(input.files ?? [])]);
                    // The same files can be chosen again after a failed send.
                    input.value = "";
                }}
            />
        </div>
    );
}
