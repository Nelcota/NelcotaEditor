import PlusIcon from "~icons/lucide/plus";
import UploadIcon from "~icons/lucide/upload";
import { useId } from "react";
import type { ReactNode } from "react";
import { ALLOWED_VIDEO_EXTENSIONS } from "#/modules/video-records/model/upload-limits";
import { buttonVariants } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";

const ACCEPTED_TYPES = ALLOWED_VIDEO_EXTENSIONS.join(",");

interface SessionDropzoneProps {
    onFiles: (files: Array<File>) => void;
    variant: "empty" | "compact";
}

/** The native file input covers the drop area so uploading also works by keyboard or touch. */
export function SessionDropzone({ onFiles, variant }: SessionDropzoneProps): ReactNode {
    const inputId = useId();
    const hintId = `${inputId}-hint`;
    const isEmpty = variant === "empty";
    let describedBy: string | undefined;

    if (isEmpty === true) {
        describedBy = hintId;
    }

    return (
        <div
            className={cn(
                "group relative rounded-xl has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-ring",
                isEmpty &&
                    "grid min-h-56 place-items-center content-center gap-4 rounded-2xl border border-dashed border-input bg-background px-4 py-8 text-center transition-colors has-[input:hover]:border-primary-ink has-[input:hover]:bg-primary/5",
            )}
        >
            {isEmpty && (
                <div className="grid gap-1.5">
                    <p className="font-semibold pointer-coarse:hidden">Arraste seus vídeos aqui</p>
                    <p id={hintId} className="text-xs text-pretty text-muted-foreground">
                        MP4, MOV, MKV, WEBM, AVI ou M4V · Vertical (9:16)
                    </p>
                </div>
            )}
            <label
                htmlFor={inputId}
                className={cn(
                    "font-semibold",
                    isEmpty &&
                        buttonVariants({
                            size: "lg",
                            className: "group-has-[input:hover]:bg-primary-solid-hover",
                        }),
                    isEmpty === false &&
                        buttonVariants({
                            variant: "outline",
                            size: "lg",
                            className: "group-has-[input:hover]:bg-accent",
                        }),
                )}
            >
                {isEmpty && <UploadIcon aria-hidden="true" className="size-4" />}
                {isEmpty === false && <PlusIcon aria-hidden="true" className="size-4" />}
                {isEmpty && "Selecionar vídeos"}
                {isEmpty === false && "Adicionar vídeos"}
            </label>
            <input
                id={inputId}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                aria-describedby={describedBy}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                onChange={(event) => {
                    const input = event.currentTarget;
                    onFiles([...(input.files ?? [])]);
                    input.value = "";
                }}
            />
        </div>
    );
}
