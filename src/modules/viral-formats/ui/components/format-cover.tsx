import type { ReactNode } from "react";
import type { ViralFormatId } from "#/modules/viral-formats/model/viral-formats";
import { cn } from "#/shared/ui/cn";

const RANKING_POSITIONS = [1, 2, 3, 4, 5] as const;
const BLOCK_CLASS = "rounded-lg bg-foreground/10";

/** Each format's layout drawn in blocks, in place of its demo video until one is published. */
const COVER_LAYOUTS: Record<ViralFormatId, () => ReactNode> = {
    "split-screen": () => (
        <div className="grid size-full grid-rows-2 gap-1.5">
            <div className={BLOCK_CLASS} />
            <div className="rounded-lg bg-primary/25" />
        </div>
    ),
    ranking: () => (
        <ol className="grid size-full content-center gap-1.5">
            {RANKING_POSITIONS.map((position) => (
                <li
                    key={position}
                    className={cn(
                        "flex h-5 items-center rounded-md px-2 text-xs font-bold tabular-nums",
                        position === 1 && "bg-primary-solid text-primary-foreground",
                        position !== 1 && "bg-foreground/10 text-muted-foreground",
                    )}
                >
                    {position}
                </li>
            ))}
        </ol>
    ),
    "this-or-that": () => (
        <div className="relative grid size-full grid-cols-2 gap-1.5">
            <div className={BLOCK_CLASS} />
            <div className="rounded-lg bg-primary/25" />
            <span className="absolute inset-x-0 top-1/2 mx-auto grid size-7 -translate-y-1/2 place-items-center rounded-full bg-primary-solid text-xs font-bold text-primary-foreground">
                OU
            </span>
        </div>
    ),
    generic: () => (
        <div className="grid size-full grid-rows-[1fr_auto] gap-2">
            <div className={BLOCK_CLASS} />
            <div className="mx-auto h-3 w-3/4 rounded-full bg-primary/40" />
        </div>
    ),
    app: () => (
        <div className="grid size-full place-items-center">
            <div className="grid h-full w-3/5 grid-rows-[auto_1fr] gap-1 rounded-xl border-2 border-foreground/20 p-1.5">
                <div className="mx-auto h-1 w-1/3 rounded-full bg-foreground/20" />
                <div className="rounded-md bg-primary/25" />
            </div>
        </div>
    ),
};

interface FormatCoverProps {
    formatId: ViralFormatId;
    className?: string;
}

export function FormatCover({ formatId, className }: FormatCoverProps): ReactNode {
    const Layout = COVER_LAYOUTS[formatId];

    return (
        <div
            aria-hidden="true"
            className={cn("aspect-clip-card w-full rounded-xl bg-stage p-3", className)}
        >
            <Layout />
        </div>
    );
}
