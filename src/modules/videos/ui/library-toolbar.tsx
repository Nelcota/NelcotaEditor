import type { ReactNode } from "react";
import { SearchField } from "#/modules/videos/ui/search-field";
import { VIDEO_FILTERS, VIDEO_FILTER_LABELS } from "#/modules/videos/ui/video-list-filter";
import type { VideoFilter } from "#/modules/videos/ui/video-list-filter";
import { VIDEO_SORTS, VIDEO_SORT_LABELS, toVideoSort } from "#/modules/videos/ui/video-sort";
import type { VideoSort } from "#/modules/videos/ui/video-sort";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";

interface LibraryToolbarProps {
    query: string;
    onQueryChange: (query: string) => void;
    filter: VideoFilter;
    onFilterChange: (filter: VideoFilter) => void;
    counts: Record<VideoFilter, number>;
    sort: VideoSort;
    onSortChange: (sort: VideoSort) => void;
}

const TRIGGER_CLASS = "h-10 w-full bg-background sm:w-44";

/** An empty status is noise; "Todos" and the one in use always stay, so nobody gets stranded. */
function isFilterShown(option: VideoFilter, filter: VideoFilter, count: number): boolean {
    return option === "all" || option === filter || count > 0;
}

function toVideoFilter(value: string): VideoFilter {
    return VIDEO_FILTERS.find((filter) => filter === value) ?? "all";
}

/** Search on the leading side; status and order trailing, each a compact list. Phones stack them. */
export function LibraryToolbar(props: LibraryToolbarProps): ReactNode {
    const { query, onQueryChange, filter, onFilterChange, counts, sort, onSortChange } = props;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <SearchField
                label="Buscar vídeo pelo título"
                placeholder="Buscar vídeo"
                value={query}
                onValueChange={onQueryChange}
            />
            <span className="hidden flex-1 sm:block" />
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                <Select
                    value={filter}
                    onValueChange={(value) => onFilterChange(toVideoFilter(value))}
                >
                    <SelectTrigger aria-label="Filtrar por situação" className={TRIGGER_CLASS}>
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
                    <SelectTrigger aria-label="Ordenar vídeos" className={TRIGGER_CLASS}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="end">
                        {VIDEO_SORTS.map((option) => (
                            <SelectItem key={option} value={option}>
                                {VIDEO_SORT_LABELS[option]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
