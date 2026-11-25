import ArrowUpDownIcon from "~icons/lucide/arrow-up-down";
import LayoutGridIcon from "~icons/lucide/layout-grid";
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
import { TOOLBAR_SELECT_TRIGGER_CLASS } from "#/modules/videos/ui/components/library-toolbar";
import type { IconComponent } from "#/shared/ui/icon-component";
import { SearchField } from "#/shared/ui/search-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";

/** The trigger shows the shape in use, so the icon changes with the choice. */
const VIEW_MODE_ICONS: Record<ClipViewMode, IconComponent> = {
    grid: LayoutGridIcon,
    table: TableIcon,
};

interface ClipsToolbarProps {
    query: string;
    onQueryChange: (query: string) => void;
    order: { value: ClipOrder; onChange: (order: ClipOrder) => void };
    view: { value: ClipViewMode; onChange: (view: ClipViewMode) => void };
    countLabel: string;
}

function OrderSelect({ order }: { order: ClipsToolbarProps["order"] }): ReactNode {
    return (
        <Select
            value={order.value}
            onValueChange={(value) => {
                // The options are the known orders, so anything else is ignored.
                if (isClipOrder(value) === true) {
                    order.onChange(value);
                }
            }}
        >
            <SelectTrigger aria-label="Ordenar cortes" className={TOOLBAR_SELECT_TRIGGER_CLASS}>
                <ArrowUpDownIcon aria-hidden="true" className="size-4 text-primary-ink" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
                {CLIP_ORDERS.map((option) => (
                    <SelectItem key={option} value={option}>
                        {CLIP_ORDER_LABELS[option]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function ViewModeSelect({ view }: { view: ClipsToolbarProps["view"] }): ReactNode {
    const Icon = VIEW_MODE_ICONS[view.value];

    return (
        <Select
            value={view.value}
            onValueChange={(value) => {
                if (isClipViewMode(value) === true) {
                    view.onChange(value);
                }
            }}
        >
            <SelectTrigger aria-label="Exibir cortes como" className={TOOLBAR_SELECT_TRIGGER_CLASS}>
                <Icon aria-hidden="true" className="size-4 text-primary-ink" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
                {CLIP_VIEW_MODES.map((option) => (
                    <SelectItem key={option} value={option}>
                        {CLIP_VIEW_MODE_LABELS[option]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
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
                <OrderSelect order={order} />
                <ViewModeSelect view={view} />
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
