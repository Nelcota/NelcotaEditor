import { OVERVIEW_PERIOD_DAYS, overviewPeriodSchema } from "#/modules/overview/overview-period";
import type { OverviewPeriodDays } from "#/modules/overview/overview-period";
import { SegmentedControl } from "#/shared/ui/segmented-control";

interface PeriodPickerProps {
    value: OverviewPeriodDays;
    onChange: (periodDays: OverviewPeriodDays) => void;
}

const PERIOD_OPTIONS = OVERVIEW_PERIOD_DAYS.map((periodDays) => ({
    value: String(periodDays),
    label: (
        <>
            {/* Three full labels overflow a 375 px phone; screen readers still hear them. */}
            <span className="max-sm:sr-only">Últimos </span>
            {periodDays} dias
        </>
    ),
    ariaLabel: `Últimos ${periodDays} dias`,
}));

/** The same pill choice as the sort controls: a short choice that changes what the page shows. */
export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
    return (
        <SegmentedControl
            label="Período"
            value={String(value)}
            options={PERIOD_OPTIONS}
            onValueChange={(next) => {
                const result = overviewPeriodSchema.safeParse(Number(next));

                if (result.success === false) {
                    return;
                }

                onChange(result.data);
            }}
            className="w-full whitespace-nowrap [&>button]:px-3 sm:w-fit"
        />
    );
}
