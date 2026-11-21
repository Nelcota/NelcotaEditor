import CloseIcon from "~icons/solar/close-linear";
import VideoFramePlayHorizontalIcon from "~icons/solar/video-frame-play-horizontal-linear";
import { Button } from "#/shared/ui/button";
import { formatBytes } from "#/shared/ui/format";

interface SelectedFileProps {
    file: File;
    disabled: boolean;
    onClear: () => void;
}

/** The chosen file by name and size, with a way to pick another. */
export function SelectedFile({ file, disabled, onClear }: SelectedFileProps) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border bg-background p-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary">
                <VideoFramePlayHorizontalIcon
                    className="size-6 text-muted-foreground"
                    aria-hidden="true"
                />
            </span>
            <div className="min-w-0 flex-1">
                <p
                    title={file.name}
                    className="line-clamp-2 font-semibold [overflow-wrap:anywhere]"
                >
                    {file.name}
                </p>
                <p className="text-meta text-muted-foreground">
                    Arquivo do computador · {formatBytes(file.size)}
                </p>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClear}
                disabled={disabled}
                aria-label="Trocar o arquivo"
            >
                <CloseIcon aria-hidden="true" />
            </Button>
        </div>
    );
}
