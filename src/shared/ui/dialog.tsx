import CloseIcon from "~icons/solar/close-linear";
import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "#/shared/ui/cn";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogOverlay({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
                className,
            )}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
    return (
        <DialogPrimitive.Portal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    "fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-5 overflow-y-auto rounded-2xl border bg-popover p-(--dialog-padding) shadow-2xl [--dialog-padding:--spacing(6)] outline-none duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-xl",
                    className,
                )}
                {...props}
            >
                {children}
                <DialogPrimitive.Close
                    data-slot="dialog-close"
                    className="absolute top-[calc(var(--dialog-padding)-0.125rem)] right-[calc(var(--dialog-padding)-0.5rem)] grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99] [&_svg]:size-4"
                >
                    <CloseIcon aria-hidden="true" />
                    <span className="sr-only">Fechar</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn("flex flex-col gap-1 pr-8", className)}
            {...props}
        />
    );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn("text-xl font-extrabold tracking-tight", className)}
            {...props}
        />
    );
}

function DialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    );
}

export { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle };
