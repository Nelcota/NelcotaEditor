import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { ReactNode } from "react";
import type { AdminUsersSearch } from "#/modules/admin/model/admin-search";
import { AdminPager } from "#/modules/admin/ui/components/admin-pager";
import { adminUsersQueryOptions } from "#/modules/admin/model/admin-queries";
import { toPageSearch, toQuerySearch } from "#/modules/admin/model/admin-search-params";
import { AdminLoadError, AdminLoading } from "#/modules/admin/ui/components/admin-states";
import { AdminUserList } from "#/modules/admin/ui/components/admin-user-list";
import { useSearchDraft } from "#/modules/admin/ui/hooks/use-search-draft";
import { SearchField } from "#/shared/ui/search-field";
import { EmptyState } from "#/shared/ui/empty-state";
import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

interface ResultsProps {
    search: AdminUsersSearch;
    onSearchChange: (search: AdminUsersSearch) => void;
}

interface AdminUsersScreenProps {
    search: AdminUsersSearch;
    /** Navigates to the new search; the screen keeps the promise and any failure. */
    onSearchChange: (search: AdminUsersSearch) => Promise<unknown>;
}

/** Defaults stay out of the URL, so the plain link and the first page look the same. */
function toAdminUsersSearch(search: AdminUsersSearch): AdminUsersSearch {
    return { q: toQuerySearch(search.q), page: toPageSearch(search.page) };
}

function UserResults({ search, onSearchChange }: ResultsProps): ReactNode {
    const page = search.page ?? 1;
    const usersQuery = useQuery(adminUsersQueryOptions({ query: search.q ?? "", page }));
    const result = usersQuery.data;

    if (usersQuery.isError === true && result === undefined) {
        return (
            <AdminLoadError
                title="Não foi possível carregar as contas"
                message="Tente de novo; se continuar, recarregue a página."
                onRetry={async () => {
                    await usersQuery.refetch();
                }}
            />
        );
    }

    if (result === undefined) {
        return <AdminLoading label="Carregando contas" />;
    }

    if (result.users.length === 0) {
        return (
            <EmptyState
                art={<Mascot index={BRAND_MASCOT_INDEX} className="size-14" />}
                title="Nenhuma conta encontrada"
                description="Confira o nome ou o email digitado."
            />
        );
    }

    return (
        <div className="grid gap-3">
            <AdminUserList users={result.users} />
            <AdminPager
                page={page}
                totalCount={result.totalCount}
                onPageChange={(next) =>
                    onSearchChange(toAdminUsersSearch({ ...search, page: next }))
                }
            />
        </div>
    );
}

export function AdminUsersScreen(props: AdminUsersScreenProps): ReactNode {
    const { search, onSearchChange: navigateToSearch } = props;
    const track = useTrackPromise();
    const onSearchChange = (next: AdminUsersSearch): void => track(navigateToSearch(next));
    const handleSearch = useCallback(
        (next: string) => track(navigateToSearch(toAdminUsersSearch({ q: next, page: 1 }))),
        [navigateToSearch, track],
    );
    const searchDraft = useSearchDraft(search.q ?? "", handleSearch);

    return (
        <section aria-label="Contas" className="grid gap-4">
            <SearchField
                label="Buscar contas"
                placeholder="Nome ou email"
                value={searchDraft.draft}
                onValueChange={searchDraft.setDraft}
            />
            <UserResults search={search} onSearchChange={onSearchChange} />
        </section>
    );
}
