import ArrowUpDownIcon from "~icons/lucide/arrow-up-down";
import LayoutGridIcon from "~icons/lucide/layout-grid";
import TableIcon from "~icons/lucide/table";
import type { ReactNode } from "react";
import { CLIP_ORDERS, CLIP_ORDER_LABELS } from "#/modules/videos/model/clip-order";
import type { ClipOrder } from "#/modules/videos/model/clip-order";
import { CLIP_VIEW_MODES, CLIP_VIEW_MODE_LABELS } from "#/modules/videos/model/clip-view-mode";
import type { ClipViewMode } from "#/modules/videos/model/clip-view-mode";
import type { IconComponent } from "#/shared/ui/icon-component";
import { SearchField } from "#/shared/ui/search-field";
import { ToolbarSelect } from "#/shared/ui/toolbar-select";

/** The trigger shows the shape in use, so the icon changes with the choice. */
const VIEW_MODE_ICONS: Record<ClipViewMode, IconComponent> = {
    grid: LayoutGridIcon,
    table: TableIcon,
};

const ORDER_OPTIONS = CLIP_ORDERS.map((value) => ({ value, label: CLIP_ORDER_LABELS[value] }));

const VIEW_MODE_OPTIONS = CLIP_VIEW_MODES.map((value) => ({
    value,
    label: CLIP_VIEW_MODE_LABELS[value],
}));

interface ClipsToolbarProps {
    query: string;
    onQueryChange: (query: string) => void;
    order: { value: ClipOrder; onChange: (order: ClipOrder) => void };
    view: { value: ClipViewMode; onChange: (view: ClipViewMode) => void };
    countLabel: string;
}

/** The same toolbar as the video library: search, then the order and the view as selects. */
export function ClipsToolbar(props: ClipsToolbarProps): ReactNode {
    const { query, onQueryChange, order, view, countLabel } = props;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <SearchField
                label="Buscar por corte ou vídeo"
                placeholder="Pesquisar"
                value={query}
                onValueChange={onQueryChange}
            />
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                <ToolbarSelect
                    label="Ordenar cortes"
                    icon={ArrowUpDownIcon}
                    value={order.value}
                    options={ORDER_OPTIONS}
                    onValueChange={order.onChange}
                />
                <ToolbarSelect
                    label="Exibir cortes como"
                    icon={VIEW_MODE_ICONS[view.value]}
                    value={view.value}
                    options={VIEW_MODE_OPTIONS}
                    onValueChange={view.onChange}
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
