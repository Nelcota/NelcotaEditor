import type { ReactNode } from "react";
import { BrandGaze } from "#/shared/ui/brand-gaze";
import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { cn } from "#/shared/ui/cn";

/** The green ghost is Nelcota's mark. It is reserved: no video or crew member uses it. */
export function BrandMark({
    className,
    isAnimated = false,
}: {
    className?: string;
    isAnimated?: boolean;
}): ReactNode {
    return (
        <Mascot
            index={BRAND_MASCOT_INDEX}
            className={cn(
                "size-8",
                isAnimated === true &&
                    "mascot-animation origin-bottom mascot-motion:motion-safe:animate-brand-float",
                className,
            )}
        />
    );
}

export function BrandLogo({ className }: { className?: string }): ReactNode {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 text-2xl leading-none font-bold tracking-[-0.04em] text-foreground",
                className,
            )}
        >
            <BrandGaze />
            NELCOTA
        </span>
    );
}
