import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#/shared/ui/cn";

const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0",
    {
        variants: {
            variant: {
                // Status tones. Green and red text on their own 15% tint measured under 4.5:1 at
                // 12px, so the label stays ink and the tint and the icon carry the hue.
                neutral: "bg-muted text-muted-foreground",
                working: "bg-primary/15 text-primary-ink",
                success: "bg-success/15 text-foreground [&>svg]:text-success",
                danger: "bg-destructive/15 text-foreground [&>svg]:text-destructive",
                default: "bg-primary-solid text-primary-foreground [a&]:hover:bg-primary-solid/90",
                secondary: "bg-secondary text-foreground [a&]:hover:bg-secondary/90",
                destructive:
                    "bg-destructive text-destructive-foreground focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
                outline:
                    "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
                ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
                link: "text-primary-ink underline-offset-4 [a&]:hover:underline",
            },
        },
        // Neutral, not the ink fill: ink means "main button" across the app.
        defaultVariants: {
            variant: "neutral",
        },
    },
);

function Badge({
    className,
    variant = "neutral",
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
    return (
        <span
            data-slot="badge"
            data-variant={variant}
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
