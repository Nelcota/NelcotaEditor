import type { ReactNode } from "react";
import type { ViralFormat } from "#/modules/viral-formats/model/viral-formats";
import { FormatCover } from "#/modules/viral-formats/ui/components/format-cover";

/**
 * The dialog's left half: a real edit in the format when there is one, played on demand (the file
 * loads only on play), otherwise the format's still cover.
 */
export function FormatPreview({ format }: { format: ViralFormat }): ReactNode {
    const example = format.example;

    if (example === undefined) {
        return (
            <FormatCover
                formatId={format.id}
                className="rounded-none max-sm:hidden sm:aspect-auto sm:h-full sm:min-h-96"
            />
        );
    }

    return (
        <video
            src={example.videoUrl}
            poster={example.posterUrl}
            controls
            playsInline
            preload="none"
            aria-label={`Exemplo de vídeo no formato ${format.name}`}
            className="aspect-clip-card w-full bg-stage object-cover sm:aspect-auto sm:h-full sm:min-h-96"
        >
            <track kind="captions" src={example.captionsUrl} srcLang="pt-BR" label="Português" />
        </video>
    );
}
