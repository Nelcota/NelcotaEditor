import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { cn } from "#/shared/ui/cn";

/** The green ghost is Nelcota's mark. It is reserved: no video or crew member uses it. */
export function BrandMark({ className }: { className?: string }) {
    return <Mascot index={BRAND_MASCOT_INDEX} className={cn("size-8", className)} />;
}

/** Ghost plus the Nelcota wordmark; the ghost is the only colour. */
export function BrandLogo({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2.5 text-lg leading-none font-semibold tracking-[-0.01em] text-foreground",
                className,
            )}
        >
            <BrandMark className="size-7" />
            Nelcota
        </span>
    );
}
