import PlayIcon from "~icons/lucide/play";
import type { ReactNode } from "react";
import type { ViralFormat } from "#/modules/viral-formats/model/viral-formats";
import { FormatCover } from "#/modules/viral-formats/ui/components/format-cover";

interface FormatCardProps {
    format: ViralFormat;
    onOpen: (format: ViralFormat) => void;
}

/** One format in the row: its layout, name and line; the whole card opens it. */
export function FormatCard({ format, onOpen }: FormatCardProps): ReactNode {
    return (
        <li className="relative grid w-44 shrink-0 gap-2.5 sm:w-52">
            <FormatCover formatId={format.id} />
            <div className="grid gap-0.5">
                <button
                    type="button"
                    onClick={() => onOpen(format)}
                    className="text-start font-bold outline-none after:absolute after:inset-0 after:rounded-xl after:transition-[box-shadow] focus-visible:after:ring-4 focus-visible:after:ring-ring motion-safe:active:scale-99"
                >
                    {format.name}
                </button>
                <span className="text-meta text-muted-foreground">{format.tagline}</span>
            </div>
            <span
                aria-hidden="true"
                className="absolute end-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-primary-solid text-primary-foreground"
            >
                <PlayIcon className="ms-0.5 size-4 fill-current *:fill-current" />
            </span>
        </li>
    );
}
