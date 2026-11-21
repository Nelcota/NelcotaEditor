import CheckCircleIcon from "~icons/solar/check-circle-linear";
import DangerCircleIcon from "~icons/solar/danger-circle-linear";
import ForbiddenCircleIcon from "~icons/solar/forbidden-circle-linear";
import HourglassIcon from "~icons/solar/hourglass-linear";
import SortVerticalIcon from "~icons/solar/sort-vertical-linear";
import Widget2Icon from "~icons/solar/widget-2-linear";
import { Link } from "@tanstack/react-router";
import { toStatusSearch } from "#/modules/videos/ui/dashboard-search";
import { SearchField } from "#/modules/videos/ui/search-field";
import { VIDEO_FILTERS, VIDEO_FILTER_LABELS } from "#/modules/videos/ui/video-list-filter";
import type { VideoFilter } from "#/modules/videos/ui/video-list-filter";
import { VIDEO_SORTS, VIDEO_SORT_LABELS, toVideoSort } from "#/modules/videos/ui/video-sort";
import type { VideoSort } from "#/modules/videos/ui/video-sort";
import type { IconComponent } from "#/shared/ui/icon-component";
import { SegmentedControl } from "#/shared/ui/segmented-control";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

interface VideoListToolbarProps {
    query: string;
    onQueryChange: (query: string) => void;
    filter: VideoFilter;
    counts: Record<VideoFilter, number>;
    totalLabel: string;
    sort: VideoSort;
    onSortChange: (sort: VideoSort) => void;
}

// Drawn like the segmented control (a sunken track, the current one raised), but these are links.
const CHIP_CLASS =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none transition-[color,background-color,box-shadow,scale] hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99] aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm dark:aria-[current=page]:bg-accent";

const FILTER_ICONS: Record<VideoFilter, IconComponent> = {
    all: Widget2Icon,
    processing: HourglassIcon,
    done: CheckCircleIcon,
    failed: DangerCircleIcon,
    cancelled: ForbiddenCircleIcon,
};

/** An empty status is noise; "Todos" and the chip in use always stay, so nobody gets stranded. */
function isChipShown(option: VideoFilter, filter: VideoFilter, count: number): boolean {
    return option === "all" || option === filter || count > 0;
}

interface FilterChipsProps {
    filter: VideoFilter;
    counts: Record<VideoFilter, number>;
}

/** Status filters; they live in the URL so a filtered list can be shared or reloaded. */
function FilterChips({ filter, counts }: FilterChipsProps) {
    return (
        <nav
            aria-label="Filtrar por situação"
            className="flex max-w-full min-w-0 gap-0.5 overflow-x-auto rounded-xl bg-secondary p-1 [scrollbar-width:none]"
        >
            {VIDEO_FILTERS.filter((option) => isChipShown(option, filter, counts[option])).map(
                (option) => {
                    const Icon = FILTER_ICONS[option];

                    return (
                        <Link
                            key={option}
                            to="/"
                            search={{ status: toStatusSearch(option) }}
                            // "Todos" leaves the status unset; without this it would match every filter.
                            activeOptions={{ explicitUndefined: true }}
                            aria-current={toAriaCurrent(option === filter)}
                            className={CHIP_CLASS}
                        >
                            <Icon aria-hidden="true" className="size-4" />
                            {VIDEO_FILTER_LABELS[option]}
                            <span className="text-xs tabular-nums opacity-70">
                                {counts[option]}
                            </span>
                        </Link>
                    );
                },
            )}
        </nav>
    );
}

interface SortSelectProps {
    sort: VideoSort;
    onSortChange: (sort: VideoSort) => void;
}

const SORT_OPTIONS = VIDEO_SORTS.map((value) => ({ value, label: VIDEO_SORT_LABELS[value] }));

/** Three fixed orders: all visible at once instead of a list that opens over the page. */
function SortSelect({ sort, onSortChange }: SortSelectProps) {
    return (
        <div className="flex w-full items-center gap-2 sm:w-auto">
            <SortVerticalIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
            />
            <SegmentedControl
                label="Ordenar vídeos"
                value={sort}
                options={SORT_OPTIONS}
                onValueChange={(value) => onSortChange(toVideoSort(value))}
                className="flex-1 [&>button]:whitespace-nowrap sm:flex-none"
            />
        </div>
    );
}

export function VideoListToolbar(props: VideoListToolbarProps) {
    const { query, onQueryChange, filter, counts, totalLabel, sort, onSortChange } = props;

    // One row on wide screens: narrow by status on the leading side, find and order trailing.
    // Phones stack them, each full width.
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <FilterChips filter={filter} counts={counts} />
            <p role="status" className="sr-only">
                {totalLabel}
            </p>
            <span className="hidden flex-1 lg:block" />
            <SearchField
                label="Buscar por título"
                placeholder="Buscar por título"
                value={query}
                onValueChange={onQueryChange}
            />
            <SortSelect sort={sort} onSortChange={onSortChange} />
        </div>
    );
}
