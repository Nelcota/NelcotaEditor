import UploadIcon from "~icons/solar/upload-linear";
import { useId } from "react";
import { ALLOWED_VIDEO_EXTENSIONS } from "#/modules/video-records/upload-limits";
import { SourceProblem } from "#/modules/videos/ui/source-problem";
import { cn } from "#/shared/ui/cn";

// No-break spaces keep each number with its unit when the line wraps.
const LIMITS_TEXT = "3 horas · 5 GB";

const ACCEPTED_FILE_TYPES = `video/*,${ALLOWED_VIDEO_EXTENSIONS.join(",")}`;

interface VideoFilePickerProps {
    disabled: boolean;
    problem: string | null;
    onFileChosen: (file: File | undefined) => void;
}

/** The "choose on the computer" way in, with the limits written under it. */
export function VideoFilePicker({ disabled, problem, onFileChosen }: VideoFilePickerProps) {
    const fileInputId = useId();
    const problemId = `${fileInputId}-problem`;

    return (
        <div className="grid justify-items-center gap-1.5 text-center">
            <label
                htmlFor={fileInputId}
                className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-md text-sm font-medium outline-none transition-[color,background-color,border-color,box-shadow,scale] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring/70",
                    disabled === true && "cursor-not-allowed opacity-50",
                    disabled === false && "hover:text-primary-ink motion-safe:active:scale-[0.99]",
                )}
            >
                <UploadIcon className="size-5" aria-hidden="true" />
                <span className="pointer-coarse:hidden">
                    Arraste um arquivo aqui ou{" "}
                    <span className="underline underline-offset-4">escolha no computador</span>
                </span>
                <span className="hidden underline underline-offset-4 pointer-coarse:inline">
                    Escolher um vídeo do aparelho
                </span>
                <input
                    id={fileInputId}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    className="sr-only"
                    disabled={disabled}
                    aria-describedby={problemId}
                    onChange={(event) => {
                        const input = event.target;
                        onFileChosen(input.files?.[0]);
                        // Cleared so picking the same file again after a problem still fires.
                        input.value = "";
                    }}
                />
            </label>
            <p className="text-xs text-muted-foreground">
                YouTube público ou não listado, ou arquivo MP4, MOV, MKV, WEBM, AVI · até{" "}
                {LIMITS_TEXT}
            </p>
            {/* Always mounted, so a problem found after picking a file is announced. */}
            <div role="alert">
                <SourceProblem id={problemId} message={problem} />
            </div>
        </div>
    );
}
