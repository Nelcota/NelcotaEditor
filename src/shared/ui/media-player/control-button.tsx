import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import type { IconComponent } from "#/shared/ui/icon-component";

export type ControlSize = "md" | "sm";

const SIZE_CLASSES: Record<ControlSize, string> = {
    md: "size-10 [&>svg]:size-5",
    sm: "size-8 [&>svg]:size-4",
};

interface ControlButtonProps {
    label: string;
    icon: IconComponent;
    onClick: () => Promise<void> | void;
    size?: ControlSize;
    isDisabled?: boolean;
    className?: string;
}

/** An icon button drawn over video: white, with a soft light behind it on hover. */
export function ControlButton({
    label,
    icon: Icon,
    onClick,
    size = "md",
    isDisabled = false,
    className,
}: ControlButtonProps): ReactNode {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={isDisabled}
            onClick={async () => {
                await onClick();
            }}
            className={cn(
                "grid shrink-0 place-items-center rounded-lg text-white outline-none transition-colors hover:bg-white/15 focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent motion-safe:active:scale-[0.99]",
                SIZE_CLASSES[size],
                className,
            )}
        >
            <Icon aria-hidden="true" />
        </button>
    );
}
