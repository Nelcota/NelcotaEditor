import ArrowUpIcon from "~icons/lucide/arrow-up";
import type { ReactNode } from "react";
import { BrandMark } from "#/shared/ui/brand-logo";

interface ShowcaseClip {
    imageUrl: string;
    title: string;
    score: number;
}

/** Frames of real rendered clips, the same the public site shows (Pexels footage, see README). */
const SHOWCASE_CLIPS: ReadonlyArray<ShowcaseClip> = [
    { imageUrl: "/auth/podcast-1.webp", title: "O erro que todo iniciante comete", score: 94 },
    { imageUrl: "/auth/live-2.webp", title: "A jogada que virou a partida", score: 91 },
    { imageUrl: "/auth/aula-1.webp", title: "Revisão em 3 passos", score: 88 },
    { imageUrl: "/auth/aula-4.webp", title: "Por que isso funciona", score: 85 },
];

function ShowcaseCard({ clip }: { clip: ShowcaseClip }): ReactNode {
    return (
        // The fourth clip only fits whole titles on wide screens; below that it would cut them.
        <div className="overflow-hidden rounded-xl border border-border bg-card last:hidden xl:last:block">
            <img
                src={clip.imageUrl}
                alt=""
                loading="lazy"
                className="aspect-clip-card w-full object-cover"
            />
            <div className="grid gap-0.5 p-2.5">
                <span className="line-clamp-2 text-xs leading-snug font-semibold">
                    {clip.title}
                </span>
                <span className="text-xs text-muted-foreground">Nota {clip.score}</span>
                <span className="mt-2 grid h-7 place-items-center rounded-lg bg-primary-solid text-xs font-semibold text-primary-foreground">
                    Baixar
                </span>
            </div>
        </div>
    );
}

/**
 * The app beside the form, always dark: the link box of Início and finished clips, so the person
 * sees what is on the other side of signing in. A picture of the product, not controls.
 */
export function AuthShowcase(): ReactNode {
    return (
        <div
            aria-hidden="true"
            className="theme-app hidden content-center gap-7 overflow-hidden rounded-frame bg-background p-10 xl:p-12 font-sans text-foreground lg:grid"
        >
            <p className="flex items-center gap-3 text-title font-semibold tracking-display">
                <BrandMark className="h-9" />
                Cole um link. O Nel corta.
            </p>
            <div className="grid gap-5 rounded-2xl border border-border bg-card p-4 text-muted-foreground">
                <span>youtube.com/watch?v=…</span>
                <span className="flex items-center gap-1.5">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                        5 cortes
                    </span>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                        1 minuto
                    </span>
                    <span className="ms-auto grid size-8 place-items-center rounded-full bg-primary-solid text-primary-foreground">
                        <ArrowUpIcon className="size-4" />
                    </span>
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 xl:grid-cols-4">
                {SHOWCASE_CLIPS.map((clip) => (
                    <ShowcaseCard key={clip.imageUrl} clip={clip} />
                ))}
            </div>
        </div>
    );
}
