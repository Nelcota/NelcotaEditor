import type { ReactNode } from "react";
import { describeClipCount } from "#/modules/videos/model/describe-new-video-source";
import { NewVideoPreview } from "#/modules/videos/ui/components/new-video-preview";
import type { VideoSource } from "#/modules/videos/model/video-source";
import { Button } from "#/shared/ui/button";

function describeSourceKind(source: VideoSource): string {
    if (source.kind === "file") {
        return source.file.name;
    }

    return "Link do YouTube";
}

interface ReviewRowProps {
    label: string;
    value: string;
    onChange: () => void;
}

function ReviewRow({ label, value, onChange }: ReviewRowProps): ReactNode {
    return (
        <li className="flex items-center gap-3 rounded-xl bg-card px-4 py-3">
            <p className="grid min-w-0 flex-1 gap-0.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold break-words">{value}</span>
            </p>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onChange}
                aria-label={`Mudar ${label.toLowerCase()}`}
                className="text-primary-ink"
            >
                Mudar
            </Button>
        </li>
    );
}

interface NewVideoReviewProps {
    source: VideoSource;
    title: string;
    clipCount: number;
    clipLengthLabel: string;
    languageLabel: string;
    /** Opens a step again: 0 the video, 1 the clips, 2 the language. */
    onEditStep: (index: number) => void;
}

/** The last step: the video as it will enter the list, and every choice with a way back to it. */
export function NewVideoReview(props: NewVideoReviewProps): ReactNode {
    const { source, title, clipCount, clipLengthLabel, languageLabel, onEditStep } = props;

    return (
        <div className="grid gap-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:items-start">
            <NewVideoPreview source={source} title={title} />
            <ul className="grid gap-2">
                <ReviewRow
                    label="Vídeo"
                    value={describeSourceKind(source)}
                    onChange={() => onEditStep(0)}
                />
                <ReviewRow
                    label="Cortes"
                    value={`${describeClipCount(clipCount)} · ${clipLengthLabel}`}
                    onChange={() => onEditStep(1)}
                />
                <ReviewRow
                    label="Idioma da fala"
                    value={languageLabel}
                    onChange={() => onEditStep(2)}
                />
            </ul>
        </div>
    );
}
