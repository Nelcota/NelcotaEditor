import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#/shared/ui/cn";
import { Slot } from "radix-ui";

const buttonVariants = cva(
    "group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,scale,opacity,filter] outline-none motion-safe:not-disabled:not-aria-disabled:active:scale-[0.99] aria-busy:cursor-progress focus-visible:ring-4 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
    {
        variants: {
            variant: {
                // A vertical gradient with a lighter border, as on the landing page. The ring is the
                // same blue as the fill; the offset gap keeps it from reading as a bigger button.
                default:
                    "border border-[color-mix(in_oklab,var(--primary-solid)_75%,white)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary-solid)_80%,white),var(--primary-solid))] text-primary-foreground shadow-[0_8px_22px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent),inset_0_1px_0_rgba(255,255,255,0.2)] not-disabled:hover:brightness-110 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                destructive:
                    "bg-destructive font-medium text-destructive-foreground not-disabled:hover:bg-destructive/90",
                outline:
                    "border border-card-border bg-card not-disabled:hover:bg-accent not-disabled:hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground not-disabled:hover:bg-foreground/10",
                ghost: "not-disabled:hover:bg-secondary not-disabled:hover:text-accent-foreground",
                link: "text-primary-ink underline-offset-4 not-disabled:hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2 has-[>svg]:px-3.5",
                xs: "h-6 gap-1 rounded-lg px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
                sm: "h-8 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5",
                lg: "h-11 rounded-xl px-6 has-[>svg]:px-4",
                icon: "size-10",
                "icon-xs": "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
                // 44px on touch screens, the minimum comfortable finger target.
                "icon-sm": "size-8 rounded-lg pointer-coarse:size-11",
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
