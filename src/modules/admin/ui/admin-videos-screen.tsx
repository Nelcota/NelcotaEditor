import CircleCheckIcon from "~icons/lucide/circle-check";
import ClockIcon from "~icons/lucide/clock";
import CircleAlertIcon from "~icons/lucide/circle-alert";
import BanIcon from "~icons/lucide/ban";
import HourglassIcon from "~icons/lucide/hourglass";
import LayoutGridIcon from "~icons/lucide/layout-grid";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useCallback } from "react";
import type { ReactNode } from "react";
import { ADMIN_VIDEO_FILTERS, DEFAULT_ADMIN_VIDEO_FILTER } from "#/modules/admin/admin-search";
import type { AdminVideoFilter, AdminVideosSearch } from "#/modules/admin/admin-search";
import { toPageSearch, toQuerySearch } from "#/modules/admin/ui/admin-search-params";
import { AdminPager } from "#/modules/admin/ui/admin-pager";
import { adminVideosQueryOptions } from "#/modules/admin/ui/admin-queries";
import { AdminLoadError, AdminLoading } from "#/modules/admin/ui/admin-states";
import { AdminVideoList } from "#/modules/admin/ui/admin-video-list";
import { useSearchDraft } from "#/modules/admin/ui/use-search-draft";
import { SearchField } from "#/modules/videos/ui/search-field";
import { EmptyState } from "#/shared/ui/empty-state";
import type { IconComponent } from "#/shared/ui/icon-component";
import { Mascot } from "#/shared/ui/mascot";
import { BRAND_MASCOT_INDEX } from "#/shared/ui/mascot";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const CHIP_CLASS =
    "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium whitespace-nowrap outline-none transition-[color,background-color,border-color,box-shadow,scale] hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background aria-[current=page]:hover:bg-foreground/90 [&>svg]:size-5";

const FILTER_LABELS: Record<AdminVideoFilter, string> = {
    all: "Todos",
    working: "Processando",
    queued: "Na fila",
    failed: "Falharam",
    cancelled: "Cancelados",
    done: "Prontos",
};

const FILTER_ICONS: Record<AdminVideoFilter, IconComponent> = {
    all: LayoutGridIcon,
    working: HourglassIcon,
    queued: ClockIcon,
    failed: CircleAlertIcon,
    cancelled: BanIcon,
    done: CircleCheckIcon,
};

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

interface FilterChipsProps {
    filter: AdminVideoFilter;
    query: string;
}

function FilterChips({ filter, query }: FilterChipsProps): ReactNode {
    return (
        <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-1.5">
            {ADMIN_VIDEO_FILTERS.map((option) => {
                const Icon = FILTER_ICONS[option];

                return (
                    <Link
                        key={option}
                        to="/admin/videos"
                        search={{ q: toQuerySearch(query), filter: toFilterSearch(option) }}
                        // "Todos" leaves the filter unset; without this it would match every filter.
                        activeOptions={{ explicitUndefined: true }}
                        aria-current={toAriaCurrent(option === filter)}
                        className={CHIP_CLASS}
                    >
                        <Icon aria-hidden="true" />
                        {FILTER_LABELS[option]}
                    </Link>
                );
            })}
        </nav>
    );
}

interface AdminVideosScreenProps {
    search: AdminVideosSearch;
    onSearchChange: (search: AdminVideosSearch) => void;
}

function VideoResults({ search, onSearchChange }: AdminVideosScreenProps): ReactNode {
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
            <AdminPager
                page={page}
                totalCount={result.totalCount}
                onPageChange={(next) =>
                    onSearchChange(toAdminVideosSearch({ ...search, page: next }))
                }
            />
        </div>
    );
}

export function AdminVideosScreen({ search, onSearchChange }: AdminVideosScreenProps): ReactNode {
    const query = search.q ?? "";
    const handleSearch = useCallback(
        (next: string) => onSearchChange(toAdminVideosSearch({ ...search, q: next, page: 1 })),
        [search, onSearchChange],
    );
    const searchDraft = useSearchDraft(query, handleSearch);

    return (
        <section aria-label="Vídeos de todas as contas" className="grid gap-4">
            <div className="grid gap-3">
                <SearchField
                    label="Buscar vídeos"
                    placeholder="Título, nome ou email do dono"
                    value={searchDraft.draft}
                    onValueChange={searchDraft.setDraft}
                />
                <FilterChips filter={search.filter ?? DEFAULT_ADMIN_VIDEO_FILTER} query={query} />
            </div>
            <VideoResults search={search} onSearchChange={onSearchChange} />
        </section>
    );
}
