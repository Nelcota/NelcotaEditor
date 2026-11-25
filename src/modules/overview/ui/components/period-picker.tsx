import CalendarIcon from "~icons/lucide/calendar";
import type { ReactNode } from "react";
import {
    OVERVIEW_PERIOD_DAYS,
    overviewPeriodSchema,
} from "#/modules/overview/model/overview-period";
import type { OverviewPeriodDays } from "#/modules/overview/model/overview-period";
import { ToolbarSelect } from "#/shared/ui/toolbar-select";

interface PeriodPickerProps {
    value: OverviewPeriodDays;
    onChange: (periodDays: OverviewPeriodDays) => void;
}

const PERIOD_OPTIONS = OVERVIEW_PERIOD_DAYS.map((periodDays) => ({
    value: String(periodDays),
    label: `Últimos ${periodDays} dias`,
}));

/** The same select as the lists' filters and orders: a short choice that changes the page. */
export function PeriodPicker({ value, onChange }: PeriodPickerProps): ReactNode {
    return (
        <ToolbarSelect
            label="Período"
            icon={CalendarIcon}
            value={String(value)}
            options={PERIOD_OPTIONS}
            onValueChange={(next) => {
                const result = overviewPeriodSchema.safeParse(Number(next));

                if (result.success === false) {
                    return;
                }

                onChange(result.data);
            }}
        />
    );
}
