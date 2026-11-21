import ArrowUpDownIcon from "~icons/lucide/arrow-up-down";
import { CLIP_ORDERS, CLIP_ORDER_LABELS, isClipOrder } from "#/modules/videos/ui/clip-order";
import type { ClipOrder } from "#/modules/videos/ui/clip-order";
import { SearchField } from "#/modules/videos/ui/search-field";
import { SegmentedControl } from "#/shared/ui/segmented-control";

const ORDER_OPTIONS = CLIP_ORDERS.map((value) => ({ value, label: CLIP_ORDER_LABELS[value] }));

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
            <div className="flex w-full items-center gap-2 sm:ms-auto sm:w-auto">
                <ArrowUpDownIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground"
                />
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
                    className="flex-1 sm:flex-none"
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
