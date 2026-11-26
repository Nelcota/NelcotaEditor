import type { ReactNode } from "react";
import {
    FORMAT_EXAMPLE_HEIGHT,
    FORMAT_EXAMPLE_WIDTH,
} from "#/modules/viral-formats/model/viral-formats";
import type { ViralFormat } from "#/modules/viral-formats/model/viral-formats";
import { cn } from "#/shared/ui/cn";

const RANKING_ITEMS = [
    { position: 1, label: "Luz natural" },
    { position: 2, label: "Microfone" },
    { position: 3, label: "Tripé" },
    { position: 4, label: "Enquadramento" },
    { position: 5, label: "Cenário" },
] as const;

type PhotoLoading = "eager" | "lazy";

function RankingCover({ loading }: { loading: PhotoLoading }): ReactNode {
    return (
        <div className="relative size-full overflow-hidden rounded-lg">
            <img
                src="/viral-formats/ranking-presenter.webp"
                alt=""
                width={448}
                height={704}
                loading={loading}
                className="size-full min-h-0 object-cover"
            />
            <ol className="absolute inset-x-2 bottom-2 grid gap-0.5">
                {RANKING_ITEMS.map(({ position, label }) => (
                    <li
                        key={position}
                        className={cn(
                            "flex items-center gap-1.5 rounded px-1.5 text-xs leading-5 font-bold tabular-nums",
                            position === 1 && "bg-primary-solid text-primary-foreground",
                            position !== 1 && "bg-stage/90 text-white",
                        )}
                    >
                        <span>{position}</span>
                        {label}
                    </li>
                ))}
            </ol>
        </div>
    );
}

interface FormatCoverProps {
    format: ViralFormat;
    className?: string;
    loading?: PhotoLoading;
}

export function FormatCover({ format, className, loading = "eager" }: FormatCoverProps): ReactNode {
    const example = format.example;

    return (
        <div
            aria-hidden="true"
            className={cn("aspect-clip-card w-full rounded-xl bg-stage p-3", className)}
        >
            {example !== undefined && (
                <img
                    src={example.posterUrl}
                    alt=""
                    width={FORMAT_EXAMPLE_WIDTH}
                    height={FORMAT_EXAMPLE_HEIGHT}
                    loading={loading}
                    className="size-full min-h-0 rounded-lg object-cover"
                />
            )}
            {example === undefined && format.id === "ranking" && <RankingCover loading={loading} />}
        </div>
    );
}
