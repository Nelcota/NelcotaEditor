import PlayIcon from "~icons/lucide/play";
import { useId } from "react";
import type { ReactNode } from "react";
import type { ViralFormat } from "#/modules/viral-formats/model/viral-formats";
import { FormatCover } from "#/modules/viral-formats/ui/components/format-cover";

interface FormatCardProps {
    format: ViralFormat;
    onOpen: (format: ViralFormat) => void;
}

/**
 * One format in the row: its layout, name and line; the whole card opens it. The button is its own
 * layer over the card, named by the visible title, rather than a stretched ::after: Safari makes a
 * button the containing block of its absolute pseudo-elements, which left only the title clickable.
 */
export function FormatCard({ format, onOpen }: FormatCardProps): ReactNode {
    const nameId = useId();
    const taglineId = useId();

    return (
        <li className="group relative grid w-44 shrink-0 content-start gap-2.5 transition-[scale] sm:w-52 motion-safe:has-[button:active]:scale-99">
            <FormatCover
                format={format}
                loading="lazy"
                className="transition-[background-color] group-has-[button:hover]:bg-accent"
            />
            <div className="grid gap-0.5">
                <p id={nameId} className="font-bold">
                    {format.name}
                </p>
                <p id={taglineId} className="text-meta text-muted-foreground">
                    {format.tagline}
                </p>
            </div>
            <span
                aria-hidden="true"
                className="absolute end-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-primary-solid text-primary-foreground"
            >
                <PlayIcon className="ms-0.5 size-4 fill-current *:fill-current" />
            </span>
            <button
                type="button"
                aria-labelledby={nameId}
                aria-describedby={taglineId}
                onClick={() => onOpen(format)}
                className="absolute inset-0 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-ring"
            />
        </li>
    );
}
