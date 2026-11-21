import StarIcon from "~icons/solar/star-linear";
import AltArrowLeftIcon from "~icons/solar/alt-arrow-left-linear";
import AltArrowRightIcon from "~icons/solar/alt-arrow-right-linear";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import type { RefObject } from "react";
import type { LibraryClip } from "#/modules/videos/video-views";
import { BestClipCard } from "#/modules/overview/ui/best-clip-card";
import { useScrollEdges } from "#/modules/overview/ui/use-scroll-edges";
import { Button } from "#/shared/ui/button";

// At an end the arrow only looks disabled (aria-disabled): a native `disabled` would drop the
// keyboard focus to <body> right after the press that reached it.
const EDGE_BUTTON_CLASS = "aria-disabled:opacity-50";

function CarouselControls({ scroller }: { scroller: RefObject<HTMLUListElement | null> }) {
    const edges = useScrollEdges(scroller);
    const canScrollBack = edges.canScrollBack;
    const canScrollForward = edges.canScrollForward;
    const scrollBy = (direction: number, canMove: boolean) => {
        const element = scroller.current;

        if (element === null || canMove === false) {
            return;
        }

        // No `behavior` here: the list's own `scroll-behavior` decides, so reduced motion jumps.
        element.scrollBy({ left: direction * element.clientWidth });
    };

    // Every clip already fits: arrows that can never move are noise.
    if (canScrollBack === false && canScrollForward === false) {
        return null;
    }

    return (
        <div className="flex justify-end gap-2">
            <Button
                variant="outline"
                size="icon"
                aria-label="Cortes anteriores"
                aria-disabled={canScrollBack === false}
                className={EDGE_BUTTON_CLASS}
                onClick={() => scrollBy(-1, canScrollBack)}
            >
                <AltArrowLeftIcon aria-hidden="true" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                aria-label="Próximos cortes"
                aria-disabled={canScrollForward === false}
                className={EDGE_BUTTON_CLASS}
                onClick={() => scrollBy(1, canScrollForward)}
            >
                <AltArrowRightIcon aria-hidden="true" />
            </Button>
        </div>
    );
}

function NoClipsInPeriod({ onWiden }: { onWiden: (() => void) | null }) {
    return (
        <div className="grid flex-1 place-content-center justify-items-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <p>
                <strong className="block text-foreground">Nenhum corte neste período.</strong>
                Os cortes de períodos maiores aparecem se você ampliar o filtro.
            </p>
            {onWiden !== null && (
                <Button variant="secondary" onClick={onWiden}>
                    Ampliar o período
                </Button>
            )}
        </div>
    );
}

interface BestClipsCarouselProps {
    clips: Array<LibraryClip>;
    onWiden: (() => void) | null;
}

export function BestClipsCarousel({ clips, onWiden }: BestClipsCarouselProps) {
    const scrollerRef = useRef<HTMLUListElement>(null);

    return (
        <section className="@container/clips flex min-w-0 flex-col gap-4 rounded-2xl border bg-popover p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg leading-tight font-semibold">
                    <StarIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                    Melhores cortes do período
                </h2>
                <Link
                    to="/clips"
                    className="shrink-0 rounded text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 focus-visible:outline-none"
                >
                    Ver todos
                </Link>
            </div>
            {clips.length === 0 && <NoClipsInPeriod onWiden={onWiden} />}
            {clips.length > 0 && (
                <ul
                    ref={scrollerRef}
                    aria-label="Melhores cortes, da maior nota para a menor"
                    className="-mx-1 grid snap-x snap-mandatory auto-cols-[10rem] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain px-1 scroll-px-1 motion-safe:scroll-smooth pb-1 [scrollbar-width:none] @2xl/clips:auto-cols-[calc((100%-2.25rem)/4)] @4xl/clips:auto-cols-[calc((100%-3rem)/5)]"
                >
                    {clips.map((item) => (
                        <BestClipCard key={item.clip.id} item={item} />
                    ))}
                </ul>
            )}
            {clips.length > 0 && <CarouselControls scroller={scrollerRef} />}
        </section>
    );
}
