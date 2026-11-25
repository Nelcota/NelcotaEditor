import ListFilterIcon from "~icons/lucide/list-filter";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
    ADMIN_VIDEO_FILTERS,
    DEFAULT_ADMIN_VIDEO_FILTER,
} from "#/modules/admin/model/admin-search";
import type { AdminVideoFilter, AdminVideosSearch } from "#/modules/admin/model/admin-search";
import { toPageSearch, toQuerySearch } from "#/modules/admin/model/admin-search-params";
import { AdminPager } from "#/modules/admin/ui/components/admin-pager";
import { AdminPagePastEnd } from "#/modules/admin/ui/components/admin-page-past-end";
import { adminVideosQueryOptions } from "#/modules/admin/model/admin-queries";
import { AdminLoadError, AdminLoading } from "#/modules/admin/ui/components/admin-states";
import { AdminVideoList } from "#/modules/admin/ui/components/admin-video-list";
import { useSearchDraft } from "#/modules/admin/ui/hooks/use-search-draft";
import { SearchField } from "#/shared/ui/search-field";
import { ToolbarSelect } from "#/shared/ui/toolbar-select";
import { EmptyState } from "#/shared/ui/empty-state";
import { Mascot } from "#/shared/ui/mascot";
import { BRAND_MASCOT_INDEX } from "#/shared/ui/mascot";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

const FILTER_LABELS: Record<AdminVideoFilter, string> = {
    all: "Todos",
    working: "Processando",
    queued: "Na fila",
    failed: "Falharam",
    cancelled: "Cancelados",
    done: "Prontos",
};

const FILTER_OPTIONS = ADMIN_VIDEO_FILTERS.map((value) => ({
    value,
    label: FILTER_LABELS[value],
}));

function toFilterSearch(filter: AdminVideoFilter | undefined): AdminVideoFilter | undefined {
    if (filter === DEFAULT_ADMIN_VIDEO_FILTER) {
        return undefined;
    }

    return filter;
}

/** Defaults stay out of the URL, so the plain link and the first page look the same. */
function toAdminVideosSearch(search: AdminVideosSearch): AdminVideosSearch {
    return {
        q: toQuerySearch(search.q),
        page: toPageSearch(search.page),
        filter: toFilterSearch(search.filter),
    };
}

interface ResultsProps {
    search: AdminVideosSearch;
    onSearchChange: (search: AdminVideosSearch) => void;
}

interface AdminVideosScreenProps {
    search: AdminVideosSearch;
    /** Navigates to the new search; the screen keeps the promise and any failure. */
    onSearchChange: (search: AdminVideosSearch) => Promise<unknown>;
}

function VideoResults({ search, onSearchChange }: ResultsProps): ReactNode {
    const page = search.page ?? 1;
    const videosQuery = useQuery(
        adminVideosQueryOptions({
            query: search.q ?? "",
            page,
            filter: search.filter ?? DEFAULT_ADMIN_VIDEO_FILTER,
            ownerId: null,
        }),
    );
    const result = videosQuery.data;

    if (videosQuery.isError === true && result === undefined) {
        return (
            <AdminLoadError
                title="Não foi possível carregar os vídeos"
                message="Tente de novo; se continuar, recarregue a página."
                onRetry={async () => {
                    await videosQuery.refetch();
                }}
            />
        );
    }

    if (result === undefined) {
        return <AdminLoading label="Carregando vídeos" />;
    }

    const goToPage = (next: number): void =>
        onSearchChange(toAdminVideosSearch({ ...search, page: next }));

    if (result.videos.length === 0 && result.totalCount > 0) {
        return <AdminPagePastEnd totalCount={result.totalCount} onPageChange={goToPage} />;
    }

    if (result.videos.length === 0) {
        return (
            <EmptyState
                art={<Mascot index={BRAND_MASCOT_INDEX} className="size-14" />}
                title="Nenhum vídeo aqui"
                description="Nenhum vídeo combina com esta busca e este filtro."
            />
        );
    }

    return (
        <div className="grid gap-3">
            <AdminVideoList videos={result.videos} showOwner={true} />
            <AdminPager page={page} totalCount={result.totalCount} onPageChange={goToPage} />
        </div>
    );
}

export function AdminVideosScreen(props: AdminVideosScreenProps): ReactNode {
    const { search, onSearchChange: navigateToSearch } = props;
    const track = useTrackPromise();
    const onSearchChange = (next: AdminVideosSearch): void => track(navigateToSearch(next));
    const query = search.q ?? "";
    const handleSearch = (next: string) =>
        track(navigateToSearch(toAdminVideosSearch({ ...search, q: next, page: 1 })));
    const searchDraft = useSearchDraft(query, handleSearch);

    return (
        <section aria-label="Vídeos de todas as contas" className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <SearchField
                    label="Buscar vídeos por título, nome ou email do dono"
                    placeholder="Pesquisar"
                    value={searchDraft.draft}
                    onValueChange={searchDraft.setDraft}
                />
                <ToolbarSelect
                    label="Filtrar por situação"
                    icon={ListFilterIcon}
                    value={search.filter ?? DEFAULT_ADMIN_VIDEO_FILTER}
                    options={FILTER_OPTIONS}
                    onValueChange={(filter) =>
                        onSearchChange(toAdminVideosSearch({ q: query, filter, page: 1 }))
                    }
                />
            </div>
            <VideoResults search={search} onSearchChange={onSearchChange} />
        </section>
    );
}
