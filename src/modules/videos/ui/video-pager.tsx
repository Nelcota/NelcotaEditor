import AltArrowLeftIcon from "~icons/solar/alt-arrow-left-linear";
import AltArrowRightIcon from "~icons/solar/alt-arrow-right-linear";
import { clampPageIndex } from "#/modules/videos/ui/clamp-page-index";
import { VIDEOS_PER_PAGE } from "#/modules/videos/ui/video-list-filter";
import { Button } from "#/shared/ui/button";

export interface VideoPagerProps {
    pageIndex: number;
    pageCount: number;
    itemCount: number;
    onPageChange: (pageIndex: number) => void;
}

/** "21 a 40 de 57", counted from one for people; the page index itself starts at zero. */
function describeRange(pageIndex: number, itemCount: number): string {
    const firstItem = Math.min(pageIndex * VIDEOS_PER_PAGE + 1, itemCount);
    const lastItem = Math.min(firstItem + VIDEOS_PER_PAGE - 1, itemCount);

    return `${firstItem} a ${lastItem} de ${itemCount}`;
}

export function VideoPager({ pageIndex, pageCount, itemCount, onPageChange }: VideoPagerProps) {
    if (pageCount <= 1 || itemCount <= 0) {
        return null;
    }

    const currentPageIndex = clampPageIndex(pageIndex, pageCount);
    const lastPageIndex = pageCount - 1;

    return (
        <div className="flex items-center justify-between border-t pt-3 text-[14px] text-muted-foreground tabular-nums">
            <span>{describeRange(currentPageIndex, itemCount)}</span>
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Página anterior"
                    disabled={currentPageIndex === 0}
                    onClick={() => onPageChange(currentPageIndex - 1)}
                >
                    <AltArrowLeftIcon aria-hidden="true" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Próxima página"
                    disabled={currentPageIndex >= lastPageIndex}
                    onClick={() => onPageChange(currentPageIndex + 1)}
                >
                    <AltArrowRightIcon aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
