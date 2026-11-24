import ClockIcon from "~icons/lucide/clock";
import StarIcon from "~icons/lucide/star";
import type { ComponentType, SVGProps } from "react";
import { CLIP_ORDERS, CLIP_ORDER_LABELS, isClipOrder } from "#/modules/videos/model/clip-order";
import type { ClipOrder } from "#/modules/videos/model/clip-order";
import { SearchField } from "#/modules/videos/ui/components/search-field";
import { SegmentedControl } from "#/shared/ui/segmented-control";

const ORDER_ICONS: Record<ClipOrder, ComponentType<SVGProps<SVGSVGElement>>> = {
    newest: ClockIcon,
    best: StarIcon,
};

const ORDER_OPTIONS = CLIP_ORDERS.map((value) => {
    const Icon = ORDER_ICONS[value];

    return {
        value,
        label: (
            <span className="inline-flex items-center justify-center gap-1.5">
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {CLIP_ORDER_LABELS[value]}
            </span>
        ),
    };
});

interface ClipsToolbarProps {
    query: string;
    onQueryChange: (query: string) => void;
    order: ClipOrder;
    onOrderChange: (order: ClipOrder) => void;
    countLabel: string;
}

export function ClipsToolbar(props: ClipsToolbarProps) {
    const { query, onQueryChange, order, onOrderChange, countLabel } = props;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <SearchField
                label="Buscar cortes"
                placeholder="Buscar por corte ou vídeo"
                value={query}
                onValueChange={onQueryChange}
            />
            {/* Two fixed orders: both visible instead of a list that opens over the page. */}
            <SegmentedControl
                label="Ordenar cortes"
                value={order}
                options={ORDER_OPTIONS}
                onValueChange={(value) => {
                    // The options are the known orders, so anything else is ignored.
                    if (isClipOrder(value) === true) {
                        onOrderChange(value);
                    }
                }}
                className="w-full sm:ms-auto sm:w-auto"
            />
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
