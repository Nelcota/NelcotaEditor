import CircleCheckIcon from "~icons/lucide/circle-check";
import CircleAlertIcon from "~icons/lucide/circle-alert";
import BanIcon from "~icons/lucide/ban";
import ClockIcon from "~icons/lucide/clock";
import type { ReactNode } from "react";
import type { IconComponent } from "#/shared/ui/icon-component";
import { cn } from "#/shared/ui/cn";
import { Spinner } from "#/shared/ui/spinner";

export type StatusTone = "waiting" | "working" | "success" | "danger" | "stopped";

interface ToneStyle {
    icon: IconComponent;
    className: string;
}

const TONE_STYLES: Record<StatusTone, ToneStyle> = {
    waiting: { icon: ClockIcon, className: "bg-muted text-muted-foreground" },
    working: { icon: Spinner, className: "bg-primary/15 text-primary-ink" },
    // Green and red text on their own 15% tint measured under 4.5:1 at 13px, so the label is ink
    // and the tint and the coloured icon carry the hue.
    success: {
        icon: CircleCheckIcon,
        className: "bg-success/15 text-foreground [&>svg]:text-success",
    },
    danger: {
        icon: CircleAlertIcon,
        className: "bg-destructive/15 text-foreground [&>svg]:text-destructive",
    },
    stopped: { icon: BanIcon, className: "bg-muted text-muted-foreground" },
};

interface StatusBadgeProps {
    tone: StatusTone;
    label: string;
}

/** A status as an icon and a word in a tinted pill; the word always carries the meaning. */
export function StatusBadge({ tone, label }: StatusBadgeProps): ReactNode {
    const style = TONE_STYLES[tone];
    const Icon = style.icon;

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                style.className,
            )}
        >
            <Icon className="size-4" aria-hidden="true" />
            {label}
        </span>
    );
}
