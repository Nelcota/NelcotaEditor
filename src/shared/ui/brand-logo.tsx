import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";

/** Editor Oculto's symbol: two clips on the edit line with the play between them. */
export function BrandMark({
    className,
    isAnimated = false,
}: {
    className?: string;
    isAnimated?: boolean;
}): ReactNode {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 120 64"
            className={cn(
                "aspect-brand-mark h-8 w-auto shrink-0",
                isAnimated === true &&
                    "mascot-animation origin-bottom mascot-motion:motion-safe:animate-brand-float",
                className,
            )}
        >
            <rect width="56" height="64" rx="13" className="fill-brand" />
            <rect x="62" width="58" height="64" rx="13" className="fill-brand" />
            <path
                d="M42 17 L74 32 L42 47 Z"
                strokeWidth="5"
                strokeLinejoin="round"
                className="fill-brand-ink stroke-brand-ink"
            />
        </svg>
    );
}

export function BrandLogo({ className }: { className?: string }): ReactNode {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2.5 text-2xl leading-none font-extrabold tracking-[-0.03em] whitespace-nowrap text-foreground",
                className,
            )}
        >
            <BrandMark className="h-6.5" />
            Editor Oculto
        </span>
    );
}
