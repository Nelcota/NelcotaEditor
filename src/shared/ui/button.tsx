import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#/shared/ui/cn";
import { Slot } from "radix-ui";

const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,scale,opacity] outline-none motion-safe:not-disabled:active:scale-[0.99] aria-busy:cursor-progress focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground not-disabled:hover:bg-primary/90",
                destructive:
                    "bg-destructive font-semibold text-white not-disabled:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
                outline:
                    "border bg-background not-disabled:hover:bg-accent not-disabled:hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:not-disabled:hover:bg-input/50",
                secondary:
                    "bg-secondary text-secondary-foreground not-disabled:hover:bg-secondary/80",
                ghost: "not-disabled:hover:bg-accent not-disabled:hover:text-accent-foreground dark:not-disabled:hover:bg-accent/50",
                link: "text-primary underline-offset-4 not-disabled:hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2 has-[>svg]:px-3.5",
                xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
                sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
                lg: "h-11 rounded-md px-6 has-[>svg]:px-4",
                icon: "size-10",
                "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
                // 44px on touch screens, the minimum comfortable finger target.
                "icon-sm": "size-8 pointer-coarse:size-11",
                "icon-lg": "size-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

function Button({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    if (asChild === true) {
        return (
            <Slot.Root
                data-slot="button"
                data-variant={variant}
                data-size={size}
                className={cn(buttonVariants({ variant, size, className }))}
                {...props}
            />
        );
    }

    return (
        <button
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
