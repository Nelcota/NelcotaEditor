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

/** With this many clips or fewer they all fit, so there is nothing to scroll. */
const CLIPS_THAT_FIT = 3;

function CarouselControls({ scroller }: { scroller: RefObject<HTMLUListElement | null> }) {
    const edges = useScrollEdges(scroller);
    const scrollBy = (direction: number) => {
        const element = scroller.current;

        if (element === null) {
            return;
        }

        element.scrollBy({ left: direction * element.clientWidth, behavior: "smooth" });
    };

    return (
        <div className="flex justify-end gap-2">
            <Button
                variant="outline"
                size="icon"
                aria-label="Cortes anteriores"
                disabled={edges.canScrollBack === false}
                onClick={() => scrollBy(-1)}
            >
                <AltArrowLeftIcon aria-hidden="true" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                aria-label="Próximos cortes"
                disabled={edges.canScrollForward === false}
                onClick={() => scrollBy(1)}
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
        <section className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                    <StarIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                    Melhores cortes do período
                </h2>
                <Link
                    to="/clips"
                    className="rounded text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 focus-visible:outline-none"
                >
                    Ver todos
                </Link>
            </div>
            {clips.length === 0 && <NoClipsInPeriod onWiden={onWiden} />}
            {clips.length > 0 && (
                <ul
                    ref={scrollerRef}
                    aria-label="Melhores cortes, da maior nota para a menor"
                    className="grid snap-x snap-mandatory auto-cols-[calc((100%-24px)/3)] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
                >
                    {clips.map((item) => (
                        <BestClipCard key={item.clip.id} item={item} />
                    ))}
                </ul>
            )}
            {clips.length > CLIPS_THAT_FIT && <CarouselControls scroller={scrollerRef} />}
        </section>
    );
}
