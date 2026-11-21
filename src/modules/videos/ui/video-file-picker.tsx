import UploadIcon from "~icons/solar/upload-linear";
import { useId } from "react";
import { ALLOWED_VIDEO_EXTENSIONS } from "#/modules/videos/upload-limits";
import { SourceProblem } from "#/modules/videos/ui/source-problem";
import { cn } from "#/shared/ui/cn";

const ACCEPTED_FILE_TYPES = `video/*,${ALLOWED_VIDEO_EXTENSIONS.join(",")}`;

interface VideoFilePickerProps {
    disabled: boolean;
    problem: string | null;
    onFileChosen: (file: File | undefined) => void;
}

/** The "choose on the computer" way in, with the limits written under it. */
export function VideoFilePicker({ disabled, problem, onFileChosen }: VideoFilePickerProps) {
    const fileInputId = useId();

    return (
        <div className="grid justify-items-center gap-1.5 text-center">
            <label
                htmlFor={fileInputId}
                className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-md text-sm font-semibold outline-none transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring/70",
                    disabled === true && "cursor-not-allowed opacity-50",
                    disabled === false && "hover:text-primary motion-safe:active:scale-[0.99]",
                )}
            >
                <UploadIcon className="size-[18px]" aria-hidden="true" />
                <span>
                    Arraste um arquivo aqui ou{" "}
                    <span className="underline underline-offset-4">escolha no computador</span>
                </span>
                <input
                    id={fileInputId}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    className="sr-only"
                    disabled={disabled}
                    onChange={(event) => {
                        const input = event.target;
                        onFileChosen(input.files?.[0]);
                        // Cleared so picking the same file again after a problem still fires.
                        input.value = "";
                    }}
                />
            </label>
            <p className="text-xs text-muted-foreground">
                YouTube público ou arquivo MP4, MOV, MKV, WEBM, AVI · até 3 horas · 5 GB
            </p>
            <SourceProblem message={problem} />
        </div>
    );
}
