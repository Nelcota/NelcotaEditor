import * as React from "react";
import { cn } from "#/shared/ui/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "h-10 w-full min-w-0 rounded-xl border border-input bg-card px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                "hover:border-ring/60 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring",
                "aria-invalid:border-destructive",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
