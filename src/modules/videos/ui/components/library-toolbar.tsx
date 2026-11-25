import ArrowUpDownIcon from "~icons/lucide/arrow-up-down";
import ListFilterIcon from "~icons/lucide/list-filter";
import type { ReactNode } from "react";
import { SearchField } from "#/shared/ui/search-field";
import { VIDEO_FILTERS, VIDEO_FILTER_LABELS } from "#/modules/videos/model/video-list-filter";
import type { VideoFilter } from "#/modules/videos/model/video-list-filter";
import { VIDEO_SORTS, VIDEO_SORT_LABELS } from "#/modules/videos/model/video-sort";
import type { VideoSort } from "#/modules/videos/model/video-sort";
import { ToolbarSelect } from "#/shared/ui/toolbar-select";
import type { ToolbarSelectOption } from "#/shared/ui/toolbar-select";

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

/** An empty status is noise; "Todos" and the one in use always stay, so nobody gets stranded. */
function isFilterShown(option: VideoFilter, filter: VideoFilter, count: number): boolean {
    return option === "all" || option === filter || count > 0;
}

const SORT_OPTIONS = VIDEO_SORTS.map((value) => ({ value, label: VIDEO_SORT_LABELS[value] }));

/** Each status with its count; the trigger shows both, like "Todos 5". */
function toFilterOptions(
    filter: VideoFilter,
    counts: Record<VideoFilter, number>,
): Array<ToolbarSelectOption<VideoFilter>> {
    const shown = VIDEO_FILTERS.filter((option) => isFilterShown(option, filter, counts[option]));

    return shown.map((option) => ({
        value: option,
        label: (
            <>
                {VIDEO_FILTER_LABELS[option]}
                <span className="text-xs text-muted-foreground tabular-nums">{counts[option]}</span>
            </>
        ),
    }));
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
                <ToolbarSelect
                    label="Filtrar por situação"
                    icon={ListFilterIcon}
                    value={filter}
                    options={toFilterOptions(filter, counts)}
                    onValueChange={onFilterChange}
                />
                <ToolbarSelect
                    label="Ordenar vídeos"
                    icon={ArrowUpDownIcon}
                    value={sort}
                    options={SORT_OPTIONS}
                    onValueChange={onSortChange}
                />
            </div>
            <span className="hidden flex-1 sm:block" />
            {action}
        </div>
    );
}
