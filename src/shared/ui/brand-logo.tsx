import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { cn } from "#/shared/ui/cn";

/** The green ghost is Nelcota's mark. It is reserved: no video or crew member uses it. */
export function BrandMark({ className }: { className?: string }) {
    return <Mascot index={BRAND_MASCOT_INDEX} className={cn("size-8", className)} />;
}

/** Ghost plus the lowercase wordmark, set tight and bold like the reference's logo. */
export function BrandLogo({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 text-2xl leading-none font-bold tracking-[-0.04em] text-foreground",
                className,
            )}
        >
            <BrandMark />
            nelcota
        </span>
    );
}
