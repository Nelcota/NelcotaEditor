import type { ReactNode } from "react";
import { MAX_TITLE_LENGTH } from "#/modules/video-records/upload-limits";
import { ClipCountPicker } from "#/modules/videos/ui/clip-count-picker";
import type { VideoSource } from "#/modules/videos/ui/video-source";
import { VideoSourceField } from "#/modules/videos/ui/video-source-field";
import { TextField } from "#/shared/ui/text-field";

interface VideoStepProps {
    source: VideoSource;
    title: string;
    isSubmitAttempted: boolean;
    onSourceChange: (source: VideoSource) => void;
    onTitleChange: (title: string) => void;
}

/** Where the video comes from; a file can also get a title of its own. */
export function VideoStepFields({
    source,
    title,
    isSubmitAttempted,
    onSourceChange,
    onTitleChange,
}: VideoStepProps): ReactNode {
    return (
        <div className="grid gap-5">
            <VideoSourceField
                source={source}
                disabled={false}
                isSubmitAttempted={isSubmitAttempted}
                onSourceChange={onSourceChange}
            />
            {source.kind === "file" && (
                <TextField
                    id="new-video-title"
                    label="Título (opcional)"
                    placeholder="Usamos o nome do arquivo se ficar vazio"
                    maxLength={MAX_TITLE_LENGTH}
                    value={title}
                    onValueChange={onTitleChange}
                    errors={[]}
                />
            )}
        </div>
    );
}

interface ClipsStepProps {
    clipCount: number;
    onClipCountChange: (count: number) => void;
}

/** How many clips. */
export function ClipsStepFields({ clipCount, onClipCountChange }: ClipsStepProps): ReactNode {
    return (
        <div className="grid gap-3">
            <ClipCountPicker value={clipCount} onValueChange={onClipCountChange} disabled={false} />
            <p className="max-w-prose text-sm text-muted-foreground">
                Vídeos curtos podem render menos cortes. Funciona melhor com alguém falando.
            </p>
        </div>
    );
}
