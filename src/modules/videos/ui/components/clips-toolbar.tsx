import ClockIcon from "~icons/lucide/clock";
import LayoutGridIcon from "~icons/lucide/layout-grid";
import StarIcon from "~icons/lucide/star";
import TableIcon from "~icons/lucide/table";
import type { ReactNode } from "react";
import { CLIP_ORDERS, CLIP_ORDER_LABELS, isClipOrder } from "#/modules/videos/model/clip-order";
import type { ClipOrder } from "#/modules/videos/model/clip-order";
import {
    CLIP_VIEW_MODES,
    CLIP_VIEW_MODE_LABELS,
    isClipViewMode,
} from "#/modules/videos/model/clip-view-mode";
import type { ClipViewMode } from "#/modules/videos/model/clip-view-mode";
import type { IconComponent } from "#/shared/ui/icon-component";
import { SearchField } from "#/shared/ui/search-field";
import { SegmentedControl } from "#/shared/ui/segmented-control";

const ORDER_ICONS: Record<ClipOrder, IconComponent> = {
    newest: ClockIcon,
    best: StarIcon,
};

const VIEW_MODE_ICONS: Record<ClipViewMode, IconComponent> = {
    grid: LayoutGridIcon,
    table: TableIcon,
};

const ORDER_OPTIONS = CLIP_ORDERS.map((value) => {
    const Icon = ORDER_ICONS[value];

    return {
        value,
        label: (
            <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {CLIP_ORDER_LABELS[value]}
            </span>
        ),
    };
});

/** Icons only: the two shapes are drawn, and the name is read out and shown on hover. */
const VIEW_MODE_OPTIONS = CLIP_VIEW_MODES.map((value) => {
    const Icon = VIEW_MODE_ICONS[value];
    const label = CLIP_VIEW_MODE_LABELS[value];

    return {
        value,
        ariaLabel: label,
        label: (
            <span title={label} className="inline-flex items-center justify-center">
                <Icon aria-hidden="true" className="size-4 shrink-0" />
            </span>
        ),
    };
});

interface ClipsToolbarProps {
    query: string;
    onQueryChange: (query: string) => void;
    order: { value: ClipOrder; onChange: (order: ClipOrder) => void };
    view: { value: ClipViewMode; onChange: (view: ClipViewMode) => void };
    countLabel: string;
}

export function ClipsToolbar(props: ClipsToolbarProps): ReactNode {
    const { query, onQueryChange, order, view, countLabel } = props;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <SearchField
                label="Buscar cortes"
                placeholder="Buscar por corte ou vídeo"
                value={query}
                onValueChange={onQueryChange}
            />
            <div className="flex w-full flex-wrap items-center gap-2 sm:ms-auto sm:w-auto">
                {/* Two fixed orders: both visible instead of a list that opens over the page. */}
                <SegmentedControl
                    label="Ordenar cortes"
                    value={order.value}
                    options={ORDER_OPTIONS}
                    onValueChange={(value) => {
                        // The options are the known orders, so anything else is ignored.
                        if (isClipOrder(value) === true) {
                            order.onChange(value);
                        }
                    }}
                    className="flex-1 sm:flex-none"
                />
                <SegmentedControl
                    label="Exibir cortes como"
                    value={view.value}
                    options={VIEW_MODE_OPTIONS}
                    onValueChange={(value) => {
                        if (isClipViewMode(value) === true) {
                            view.onChange(value);
                        }
                    }}
                    className="flex-nowrap"
                />
            </div>
            <span
                aria-hidden="true"
                className="w-full text-meta text-muted-foreground tabular-nums"
            >
                {countLabel}
            </span>
            <p role="status" className="sr-only">
                {countLabel}
            </p>
        </div>
    );
}
