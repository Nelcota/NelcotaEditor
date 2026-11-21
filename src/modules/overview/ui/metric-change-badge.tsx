import ChevronDownIcon from "~icons/lucide/chevron-down";
import ChevronUpIcon from "~icons/lucide/chevron-up";
import type { ChangeDirection, ChangeTone, MetricChange } from "#/modules/overview/metric-change";
import type { IconComponent } from "#/shared/ui/icon-component";
import { cn } from "#/shared/ui/cn";

const TONE_CLASSES: Record<ChangeTone, string> = {
    good: "text-success",
    bad: "text-destructive",
    neutral: "text-muted-foreground",
};

const DIRECTION_ICONS: Record<ChangeDirection, IconComponent | null> = {
    up: ChevronUpIcon,
    down: ChevronDownIcon,
    none: null,
};

const DIRECTION_WORDS: Record<ChangeDirection, string> = {
    up: "subiu",
    down: "caiu",
    none: "",
};

export function MetricChangeBadge({ change }: { change: MetricChange }) {
    const Icon = DIRECTION_ICONS[change.direction];

    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 font-semibold tabular-nums",
                TONE_CLASSES[change.tone],
            )}
        >
            {Icon !== null && <Icon aria-hidden="true" className="size-4" />}
            <span className="sr-only">{DIRECTION_WORDS[change.direction]}</span>
            {change.label}
        </span>
    );
}
