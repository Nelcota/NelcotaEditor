import type { ReactNode } from "react";
import type { ViralFormatId } from "#/modules/viral-formats/model/viral-formats";
import { cn } from "#/shared/ui/cn";

const COVER_PHOTOS = {
    "split-presenter": { width: 448, height: 352 },
    "split-espresso": { width: 448, height: 352 },
    "ranking-presenter": { width: 448, height: 704 },
    "comparison-hot": { width: 224, height: 704 },
    "comparison-iced": { width: 224, height: 704 },
    "generic-presenter": { width: 448, height: 704 },
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

const COVER_LAYOUTS: Record<ViralFormatId, (props: CoverLayoutProps) => ReactNode> = {
    "split-screen": ({ loading }) => (
        <div className="grid size-full grid-rows-2 gap-1.5">
            <FormatPhoto name="split-presenter" loading={loading} className="rounded-lg" />
            <FormatPhoto name="split-espresso" loading={loading} className="rounded-lg" />
        </div>
    ),
    ranking: RankingCover,
    "this-or-that": ({ loading }) => (
        <div className="relative grid size-full grid-cols-2 gap-1.5">
            <FormatPhoto name="comparison-hot" loading={loading} className="rounded-lg" />
            <FormatPhoto name="comparison-iced" loading={loading} className="rounded-lg" />
            <span className="absolute inset-x-0 top-1/2 mx-auto grid size-7 -translate-y-1/2 place-items-center rounded-full bg-primary-solid text-xs font-bold text-primary-foreground">
                OU
            </span>
            <div className="absolute inset-x-0 bottom-3 grid grid-cols-2 justify-items-center gap-1.5 text-xs font-bold text-white">
                <span className="rounded bg-stage/90 px-1.5">Quente</span>
                <span className="rounded bg-stage/90 px-1.5">Gelado</span>
            </div>
        </div>
    ),
    generic: ({ loading }) => (
        <div className="relative size-full overflow-hidden rounded-lg">
            <FormatPhoto name="generic-presenter" loading={loading} />
            <div className="absolute inset-x-2 bottom-5 text-center text-sm font-extrabold text-white">
                <span className="rounded bg-stage/90 px-1.5 py-0.5">A luz muda tudo.</span>
            </div>
        </div>
    ),
};

interface FormatCoverProps {
    formatId: ViralFormatId;
    className?: string;
    loading?: PhotoLoading;
}

export function FormatCover({
    formatId,
    className,
    loading = "eager",
}: FormatCoverProps): ReactNode {
    const Layout = COVER_LAYOUTS[formatId];

    return (
        <div
            aria-hidden="true"
            className={cn("aspect-clip-card w-full rounded-xl bg-stage p-3", className)}
        >
            <Layout loading={loading} />
        </div>
    );
}
