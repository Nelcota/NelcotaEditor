import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { cn } from "#/shared/ui/cn";

/** The green ghost is Nelcota's mark. It is reserved: no video or crew member uses it. */
export function BrandMark({ className }: { className?: string }) {
    return <Mascot index={BRAND_MASCOT_INDEX} className={cn("size-8", className)} />;
}

export function BrandLogo() {
    return (
        <span className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <BrandMark />
            Nelcota
        </span>
    );
}
