/** Deleting videos can leave the page index past the last page; this keeps it on a real page. */
export function clampPageIndex(pageIndex: number, pageCount: number): number {
    if (Number.isFinite(pageIndex) === false || pageIndex < 0) {
        return 0;
    }

    if (Number.isFinite(pageCount) === false || pageCount <= 0) {
        return 0;
    }

    return Math.min(pageIndex, pageCount - 1);
}
