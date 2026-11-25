import ArrowUpDownIcon from "~icons/lucide/arrow-up-down";
import ListFilterIcon from "~icons/lucide/list-filter";
import type { ReactNode } from "react";
import { SearchField } from "#/shared/ui/search-field";
import { VIDEO_FILTERS, VIDEO_FILTER_LABELS } from "#/modules/videos/model/video-list-filter";
import type { VideoFilter } from "#/modules/videos/model/video-list-filter";
import { VIDEO_SORTS, VIDEO_SORT_LABELS, toVideoSort } from "#/modules/videos/model/video-sort";
import type { VideoSort } from "#/modules/videos/model/video-sort";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";

interface LibraryToolbarProps {
    query: string;
    onQueryChange: (query: string) => void;
    filter: VideoFilter;
    onFilterChange: (filter: VideoFilter) => void;
    counts: Record<VideoFilter, number>;
    sort: VideoSort;
    onSortChange: (sort: VideoSort) => void;
    /** The page's main button, on the trailing side. */
    action?: ReactNode;
}

/** The reference's "Filtros" and "Colunas" buttons: a filled box with blue text and icon. */
export const TOOLBAR_SELECT_TRIGGER_CLASS =
    "h-10 w-full rounded-xl border-transparent bg-card font-semibold text-primary-ink hover:border-input/40 hover:bg-accent sm:w-auto";

/** An empty status is noise; "Todos" and the one in use always stay, so nobody gets stranded. */
function isFilterShown(option: VideoFilter, filter: VideoFilter, count: number): boolean {
    return option === "all" || option === filter || count > 0;
}

function toVideoFilter(value: string): VideoFilter {
    return VIDEO_FILTERS.find((filter) => filter === value) ?? "all";
}

/** Search, the status filter and the order on the leading side; the main button trailing. */
export function LibraryToolbar(props: LibraryToolbarProps): ReactNode {
    const { query, onQueryChange, filter, onFilterChange, counts, sort, onSortChange, action } =
        props;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <SearchField
                label="Buscar vídeo pelo título"
                placeholder="Pesquisar"
                value={query}
                onValueChange={onQueryChange}
            />
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                <Select
                    value={filter}
                    onValueChange={(value) => onFilterChange(toVideoFilter(value))}
                >
                    <SelectTrigger
                        aria-label="Filtrar por situação"
                        className={TOOLBAR_SELECT_TRIGGER_CLASS}
                    >
                        <ListFilterIcon aria-hidden="true" className="size-4 text-primary-ink" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                        {VIDEO_FILTERS.filter((option) =>
                            isFilterShown(option, filter, counts[option]),
                        ).map((option) => (
                            <SelectItem key={option} value={option}>
                                {VIDEO_FILTER_LABELS[option]}
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {counts[option]}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(value) => onSortChange(toVideoSort(value))}>
                    <SelectTrigger
                        aria-label="Ordenar vídeos"
                        className={TOOLBAR_SELECT_TRIGGER_CLASS}
                    >
                        <ArrowUpDownIcon aria-hidden="true" className="size-4 text-primary-ink" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                        {VIDEO_SORTS.map((option) => (
                            <SelectItem key={option} value={option}>
                                {VIDEO_SORT_LABELS[option]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <span className="hidden flex-1 sm:block" />
            {action}
        </div>
    );
}
