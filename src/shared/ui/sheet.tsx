import XIcon from "~icons/lucide/x";
import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { cn } from "#/shared/ui/cn";

/** Logical sides, so the sheet comes in from the leading edge in either text direction. */
type SheetSide = "start" | "end";

const SIDE_CLASSES: Record<SheetSide, string> = {
    start: "inset-y-0 start-0 border-e data-[state=closed]:slide-out-to-start data-[state=open]:slide-in-from-start",
    end: "inset-y-0 end-0 border-s data-[state=closed]:slide-out-to-end data-[state=open]:slide-in-from-end",
};

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
    return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
    return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
    return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetContent({
    className,
    children,
    side = "end",
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: SheetSide }) {
    return (
        <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay
                data-slot="sheet-overlay"
                className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] dark:bg-black/70 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
            />
            <SheetPrimitive.Content
                data-slot="sheet-content"
                className={cn(
                    "fixed z-50 flex h-full w-4/5 max-w-80 flex-col gap-4 overflow-y-auto overscroll-contain bg-card p-4 ease-[cubic-bezier(0.2,0,0,1)] data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:duration-400",
                    SIDE_CLASSES[side],
                    className,
                )}
                {...props}
            >
                {children}
                <SheetPrimitive.Close className="absolute top-3 end-3 grid size-8 pointer-coarse:size-11 place-items-center rounded-md text-muted-foreground outline-none transition-[color,background-color,box-shadow,scale] hover:bg-accent hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]">
                    <XIcon className="size-5" aria-hidden="true" />
                    <span className="sr-only">Fechar</span>
                </SheetPrimitive.Close>
            </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
    );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
    return (
        <SheetPrimitive.Title
            data-slot="sheet-title"
            className={cn("font-semibold tracking-tight", className)}
            {...props}
        />
    );
}

export { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger };
