import type { ReactNode } from "react";
import { countAdminPages } from "#/modules/admin/model/count-admin-pages";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";

interface AdminPagePastEndProps {
    totalCount: number;
    onPageChange: (page: number) => void;
}

/**
 * A page after the last one: the list got shorter (rows deleted) or the address names a page that
 * never existed. The rows are still there, so this leads to them instead of saying nothing matches.
 */
export function AdminPagePastEnd({ totalCount, onPageChange }: AdminPagePastEndProps): ReactNode {
    const lastPage = countAdminPages(totalCount);

    return (
        <EmptyState
            art={<Mascot index={BRAND_MASCOT_INDEX} className="size-14" />}
            title="Esta página está vazia"
            description="A lista acaba antes desta página."
            action={
                <Button variant="outline" onClick={() => onPageChange(lastPage)}>
                    Ir para a última página
                </Button>
            }
        />
    );
}
