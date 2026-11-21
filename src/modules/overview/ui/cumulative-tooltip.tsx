import { formatDayLabel, formatInteger } from "#/modules/overview/format-metric";
import { cumulativePointSchema } from "#/modules/overview/ui/cumulative-point";

/** Recharts hands back the hovered row untyped, so it is checked before use. */
interface CumulativeTooltipProps {
    active?: boolean;
    payload?: ReadonlyArray<{ payload?: unknown }>;
}

export function CumulativeTooltip({ active, payload }: CumulativeTooltipProps) {
    if (active !== true || payload === undefined || payload.length === 0) {
        return null;
    }

    const result = cumulativePointSchema.safeParse(payload[0]?.payload);

    if (result.success === false) {
        return null;
    }

    const point = result.data;

    return (
        <div className="grid gap-0.5 rounded-md border bg-popover px-3 py-2 text-xs">
            <strong className="text-sm">
                {formatDayLabel(point.day)} · {formatInteger(point.current)} cortes
            </strong>
            <span className="text-muted-foreground">
                mesmo dia antes: {formatInteger(point.previous)}
            </span>
        </div>
    );
}
