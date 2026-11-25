import CalendarIcon from "~icons/lucide/calendar";
import ClapperboardIcon from "~icons/lucide/clapperboard";
import ScissorsIcon from "~icons/lucide/scissors";
import StarIcon from "~icons/lucide/star";
import TimerIcon from "~icons/lucide/timer";
import type { ReactNode } from "react";
import { CLIP_TABLE_COLUMNS, ClipTableRow } from "#/modules/videos/ui/components/clip-table-row";
import type { LibraryClip } from "#/modules/videos/model/video-views";
import { cn } from "#/shared/ui/cn";
import type { IconComponent } from "#/shared/ui/icon-component";

interface TableHeading {
    id: string;
    label: string;
    icon: IconComponent | null;
}

const TABLE_HEADINGS: Array<TableHeading> = [
    { id: "clip", label: "Corte", icon: ScissorsIcon },
    { id: "video", label: "Vídeo", icon: ClapperboardIcon },
    { id: "score", label: "Nota", icon: StarIcon },
    { id: "duration", label: "Duração", icon: TimerIcon },
    { id: "created", label: "Criado", icon: CalendarIcon },
    { id: "actions", label: "", icon: null },
];

function TableHeadingCell({ heading }: { heading: TableHeading }): ReactNode {
    const Icon = heading.icon;

    return (
        <span className="flex items-center gap-1.5">
            {Icon !== null && <Icon aria-hidden="true" className="size-4 shrink-0" />}
            {heading.label}
        </span>
    );
}

/** The column names over the rows; the rows say the same to screen readers, so it is hidden. */
function TableHead(): ReactNode {
    return (
        <div
            aria-hidden="true"
            className={cn(
                "hidden h-11 items-center gap-x-4 bg-card px-4 text-xs font-semibold text-muted-foreground @4xl/cliptable:grid",
                CLIP_TABLE_COLUMNS,
            )}
        >
            {TABLE_HEADINGS.map((heading) => (
                <TableHeadingCell key={heading.id} heading={heading} />
            ))}
        </div>
    );
}

/** The loaded clips as rows, for scanning many at once (the grid shows them playing). */
export function ClipTable({ items }: { items: Array<LibraryClip> }): ReactNode {
    return (
        <div className="@container/cliptable overflow-hidden rounded-2xl border">
            <TableHead />
            <ul aria-label="Seus cortes" className="divide-y @4xl/cliptable:border-t">
                {items.map((item) => (
                    <ClipTableRow key={item.clip.id} item={item} />
                ))}
            </ul>
        </div>
    );
}
