import type { ReactNode } from "react";
import {
    FORMAT_EXAMPLE_HEIGHT,
    FORMAT_EXAMPLE_WIDTH,
} from "#/modules/viral-formats/model/viral-formats";
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
                format={format}
                className="rounded-none max-sm:hidden sm:aspect-auto sm:h-full sm:min-h-96"
            />
        );
    }

    return (
        <video
            src={example.videoUrl}
            poster={example.posterUrl}
            width={FORMAT_EXAMPLE_WIDTH}
            height={FORMAT_EXAMPLE_HEIGHT}
            controls
            playsInline
            preload="none"
            aria-label={`Exemplo de vídeo no formato ${format.name}`}
            className="aspect-clip-card h-auto w-full bg-stage object-contain sm:aspect-auto sm:h-full sm:min-h-96"
        >
            <track kind="captions" src={example.captionsUrl} srcLang="pt-BR" label="Português" />
        </video>
    );
}
