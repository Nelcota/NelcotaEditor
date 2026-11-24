import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import type { IconComponent } from "#/shared/ui/icon-component";

export type ControlSize = "md" | "sm";

const SIZE_CLASSES: Record<ControlSize, string> = {
    md: "size-10 [&>svg]:size-5",
    sm: "size-8 [&>svg]:size-4",
};

interface ControlButtonProps {
    label: string;
    icon: IconComponent;
    onClick: () => void;
    size?: ControlSize;
    isDisabled?: boolean;
    className?: string;
}

/**
 * An icon button drawn over video: white, with a soft light behind it on hover. Its hint is the
 * app's own, not the native `title`, so it follows the theme and shows on keyboard focus.
 */
export function ControlButton({
    label,
    icon: Icon,
    onClick,
    size = "md",
    isDisabled = false,
    className,
}: ControlButtonProps): ReactNode {
    return (
        <HintTooltip label={label}>
            <button
                type="button"
                aria-label={label}
                disabled={isDisabled}
                onClick={onClick}
                className={cn(
                    "grid shrink-0 place-items-center rounded-lg text-white outline-none transition-colors hover:bg-white/15 focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent motion-safe:active:scale-[0.99]",
                    SIZE_CLASSES[size],
                    className,
                )}
            >
                <Icon aria-hidden="true" />
            </button>
        </HintTooltip>
    );
}
