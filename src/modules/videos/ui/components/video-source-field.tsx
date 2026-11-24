import { useState } from "react";
import type { DragEvent } from "react";
import { describeFileProblem } from "#/modules/videos/model/describe-file-problem";
import { FileDropZone } from "#/modules/videos/ui/components/file-drop-zone";
import { SelectedFile } from "#/modules/videos/ui/components/selected-file";
import { EMPTY_SOURCE, toLinkVideoId } from "#/modules/videos/model/video-source";
import type { VideoSource } from "#/modules/videos/model/video-source";
import { VideoFilePicker } from "#/modules/videos/ui/components/video-file-picker";
import { YoutubeLinkInput } from "#/modules/videos/ui/components/youtube-link-input";
import { YoutubeLinkPreview } from "#/modules/videos/ui/components/youtube-link-preview";

interface VideoSourceFieldProps {
    source: VideoSource;
    disabled: boolean;
    isSubmitAttempted: boolean;
    onSourceChange: (source: VideoSource) => void;
}

interface FileIntake {
    fileProblem: string | null;
    acceptFile: (file: File | undefined) => void;
    clearFileProblem: () => void;
}

/** A file is only taken when it passes the checks; otherwise the problem is shown instead. */
function useFileIntake(onSourceChange: (source: VideoSource) => void): FileIntake {
    const [fileProblem, setFileProblem] = useState<string | null>(null);

    const acceptFile = (file: File | undefined): void => {
        if (file === undefined) {
            return;
        }

        const problem = describeFileProblem(file);
        setFileProblem(problem);

        if (problem === null) {
            onSourceChange({ kind: "file", file });
        }
    };

    return { fileProblem, acceptFile, clearFileProblem: (): void => setFileProblem(null) };
}

/**
 * One place for both ways in: paste a YouTube link or drop a file. A good link turns into a
 * preview of the video; a file turns into its name and size.
 */
export function VideoSourceField({
    source,
    disabled,
    isSubmitAttempted,
    onSourceChange,
}: VideoSourceFieldProps) {
    const [isDragging, setIsDragging] = useState(false);
    const { fileProblem, acceptFile, clearFileProblem } = useFileIntake(onSourceChange);
    const clearSource = (): void => onSourceChange(EMPTY_SOURCE);

    const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        setIsDragging(false);

        if (disabled === true) {
            return;
        }

        acceptFile(event.dataTransfer.files[0]);
    };

    if (source.kind === "file") {
        return <SelectedFile file={source.file} disabled={disabled} onClear={clearSource} />;
    }

    const videoId = toLinkVideoId(source);

    if (videoId !== null) {
        return <YoutubeLinkPreview videoId={videoId} onClear={clearSource} />;
    }

    if (isDragging === true) {
        return <FileDropZone onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} />;
    }

    return (
        <div
            onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
            }}
            className="grid min-h-52 content-center gap-4 rounded-2xl border border-dashed border-input p-4 sm:p-6"
        >
            <YoutubeLinkInput
                value={source.text}
                disabled={disabled}
                isSubmitAttempted={isSubmitAttempted}
                onValueChange={(text) => {
                    clearFileProblem();
                    onSourceChange({ kind: "link", text });
                }}
            />
            <div className="flex items-center gap-3 text-meta text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
                ou
            </div>
            <VideoFilePicker disabled={disabled} problem={fileProblem} onFileChosen={acceptFile} />
        </div>
    );
}
