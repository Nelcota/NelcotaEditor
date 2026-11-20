import SortVerticalIcon from "~icons/solar/sort-vertical-linear";
import { CLIP_ORDERS, CLIP_ORDER_LABELS, isClipOrder } from "#/modules/videos/ui/clip-order";
import type { ClipOrder } from "#/modules/videos/ui/clip-order";
import { SearchField } from "#/modules/videos/ui/search-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";

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
            <Select
                value={order}
                onValueChange={(value) => {
                    // The options are the known orders, so anything else is ignored.
                    if (isClipOrder(value) === true) {
                        onOrderChange(value);
                    }
                }}
            >
                <SelectTrigger className="w-full rounded-full sm:w-48" aria-label="Ordenar cortes">
                    <span className="flex min-w-0 items-center gap-2">
                        <SortVerticalIcon aria-hidden="true" className="text-muted-foreground" />
                        <SelectValue />
                    </span>
                </SelectTrigger>
                <SelectContent>
                    {CLIP_ORDERS.map((option) => (
                        <SelectItem key={option} value={option}>
                            {CLIP_ORDER_LABELS[option]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="ml-auto hidden text-sm text-muted-foreground tabular-nums lg:inline">
                {countLabel}
            </span>
        </div>
    );
}
