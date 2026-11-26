import type { ReactNode } from "react";
import {
    FORMAT_EXAMPLE_HEIGHT,
    FORMAT_EXAMPLE_WIDTH,
} from "#/modules/viral-formats/model/viral-formats";
import type { ViralFormat, ViralFormatId } from "#/modules/viral-formats/model/viral-formats";
import { cn } from "#/shared/ui/cn";

const COVER_PHOTOS = {
    "split-presenter": { width: 448, height: 352 },
    "split-espresso": { width: 448, height: 352 },
    "ranking-presenter": { width: 448, height: 704 },
} as const;

const RANKING_ITEMS = [
    { position: 1, label: "Luz natural" },
    { position: 2, label: "Microfone" },
    { position: 3, label: "Tripé" },
    { position: 4, label: "Enquadramento" },
    { position: 5, label: "Cenário" },
] as const;

type PhotoLoading = "eager" | "lazy";

interface FormatPhotoProps {
    name: keyof typeof COVER_PHOTOS;
    loading: PhotoLoading;
    className?: string;
}

function FormatPhoto({ name, loading, className }: FormatPhotoProps): ReactNode {
    const { width, height } = COVER_PHOTOS[name];

    return (
        <img
            src={`/viral-formats/${name}.webp`}
            alt=""
            width={width}
            height={height}
            loading={loading}
            className={cn("size-full min-h-0 object-cover", className)}
        />
    );
}

interface CoverLayoutProps {
    loading: PhotoLoading;
}

function RankingCover({ loading }: CoverLayoutProps): ReactNode {
    return (
        <div className="relative size-full overflow-hidden rounded-lg">
            <FormatPhoto name="ranking-presenter" loading={loading} />
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

const COVER_LAYOUTS: Partial<Record<ViralFormatId, (props: CoverLayoutProps) => ReactNode>> = {
    "split-screen": ({ loading }) => (
        <div className="grid size-full grid-rows-2 gap-1.5">
            <FormatPhoto name="split-presenter" loading={loading} className="rounded-lg" />
            <FormatPhoto name="split-espresso" loading={loading} className="rounded-lg" />
        </div>
    ),
    ranking: RankingCover,
};

interface FormatCoverProps {
    format: ViralFormat;
    className?: string;
    loading?: PhotoLoading;
}

export function FormatCover({ format, className, loading = "eager" }: FormatCoverProps): ReactNode {
    const Layout = COVER_LAYOUTS[format.id];
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
            {example === undefined && Layout !== undefined && <Layout loading={loading} />}
        </div>
    );
}
