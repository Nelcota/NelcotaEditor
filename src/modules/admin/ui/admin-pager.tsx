import ChevronLeftIcon from "~icons/lucide/chevron-left";
import ChevronRightIcon from "~icons/lucide/chevron-right";
import type { ReactNode } from "react";
import { ADMIN_PAGE_SIZE } from "#/modules/admin/admin-search";
import { Button } from "#/shared/ui/button";

// At the first or last page the button only looks disabled (aria-disabled): a native `disabled`
// would drop the keyboard focus to <body> right after the press that reached the end.
const BOUND_BUTTON_CLASS = "aria-disabled:opacity-50 aria-disabled:hover:bg-transparent";

interface AdminPagerProps {
    /** Counted from one, like the URL. */
    page: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}

/** "26 a 50 de 132" and the two arrows; nothing when everything fits on one page. */
export function AdminPager({ page, totalCount, onPageChange }: AdminPagerProps): ReactNode {
    const pageCount = Math.ceil(totalCount / ADMIN_PAGE_SIZE);

    if (pageCount <= 1) {
        return null;
    }

    const currentPage = Math.min(Math.max(page, 1), pageCount);
    const firstItem = (currentPage - 1) * ADMIN_PAGE_SIZE + 1;
    const lastItem = Math.min(currentPage * ADMIN_PAGE_SIZE, totalCount);
    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= pageCount;

    return (
        <div className="flex items-center justify-between pt-1 text-meta text-muted-foreground tabular-nums">
            <span>{`${firstItem} a ${lastItem} de ${totalCount}`}</span>
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Página anterior"
                    aria-disabled={isFirstPage}
                    className={BOUND_BUTTON_CLASS}
                    onClick={() => {
                        if (isFirstPage === false) {
                            onPageChange(currentPage - 1);
                        }
                    }}
                >
                    <ChevronLeftIcon aria-hidden="true" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Próxima página"
                    aria-disabled={isLastPage}
                    className={BOUND_BUTTON_CLASS}
                    onClick={() => {
                        if (isLastPage === false) {
                            onPageChange(currentPage + 1);
                        }
                    }}
                >
                    <ChevronRightIcon aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
