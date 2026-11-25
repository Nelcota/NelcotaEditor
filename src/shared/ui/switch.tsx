import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "#/shared/ui/cn";

type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root>;

/** An on/off control that acts right away (role="switch"); name it with aria-labelledby. */
export function Switch({ className, ...props }: SwitchProps): ReactNode {
    return (
        <SwitchPrimitive.Root
            className={cn(
                "inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-accent p-0.5 outline-none transition-[background-color,box-shadow,scale] hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-50 data-[state=checked]:bg-primary-solid data-[state=checked]:hover:bg-primary-solid-hover motion-safe:enabled:active:scale-[0.99]",
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb className="size-6 rounded-full bg-foreground transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-primary-foreground motion-reduce:transition-none" />
        </SwitchPrimitive.Root>
    );
}
