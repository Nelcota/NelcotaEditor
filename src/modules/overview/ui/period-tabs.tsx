import { OVERVIEW_PERIOD_DAYS, overviewPeriodSchema } from "#/modules/overview/overview-period";
import type { OverviewPeriodDays } from "#/modules/overview/overview-period";
import { Tabs, TabsList, TabsTrigger } from "#/shared/ui/tabs";

interface PeriodTabsProps {
    value: OverviewPeriodDays;
    onChange: (periodDays: OverviewPeriodDays) => void;
}

export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
    return (
        <Tabs
            value={String(value)}
            onValueChange={(next) => {
                const result = overviewPeriodSchema.safeParse(Number(next));

                if (result.success === false) {
                    return;
                }

                onChange(result.data);
            }}
        >
            <TabsList aria-label="Período" className="h-10">
                {OVERVIEW_PERIOD_DAYS.map((periodDays) => (
                    <TabsTrigger key={periodDays} value={String(periodDays)} className="px-3">
                        Últimos {periodDays} dias
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
