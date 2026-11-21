import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn } from "#/shared/ui/cn";

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
    return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
    return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
    className,
    sideOffset = 4,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                data-slot="dropdown-menu-content"
                sideOffset={sideOffset}
                className={cn(
                    "z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-44 origin-(--radix-dropdown-menu-content-transform-origin) overflow-y-auto overscroll-contain rounded-xl border bg-popover p-1 text-popover-foreground data-[state=closed]:animate-out data-[state=closed]:duration-150 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-99 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-96",
                    className,
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
}

/**
 * A disabled item stays focusable (aria-disabled), unlike Radix's own `disabled`, which skips it:
 * arrow keys still reach it, so screen readers hear it exists and why it is off.
 */
function DropdownMenuItem({
    className,
    variant = "default",
    disabled = false,
    onSelect,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    variant?: "default" | "destructive";
}): React.ReactNode {
    return (
        <DropdownMenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-variant={variant}
            aria-disabled={disabled}
            onSelect={(event) => {
                if (disabled === true) {
                    event.preventDefault();
                    return;
                }

                if (onSelect === undefined) {
                    return;
                }

                onSelect(event);
            }}
            className={cn(
                "relative flex items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-hidden select-none transition-[color,background-color,box-shadow,scale] focus:bg-accent focus:text-accent-foreground focus-visible:ring-4 focus-visible:ring-ring/70 focus-visible:ring-inset motion-safe:active:scale-[0.99] aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:scale-100 data-[variant=destructive]:text-destructive [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuSeparator({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return (
        <DropdownMenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={cn("-mx-1 my-1 h-px bg-border", className)}
            {...props}
        />
    );
}

export {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
};
