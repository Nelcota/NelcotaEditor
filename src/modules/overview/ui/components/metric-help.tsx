import InfoIcon from "~icons/lucide/info";
import { Popover } from "radix-ui";
import type { ReactNode } from "react";

/** A popover, not a tooltip: tooltips never open on touch, and phones need the help too. */
export function MetricHelp({ label, help }: { label: string; help: string }): ReactNode {
    return (
        <Popover.Root>
            <Popover.Trigger
                aria-label={`Sobre ${label}`}
                className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none motion-safe:active:scale-[0.99]"
            >
                <InfoIcon aria-hidden="true" className="size-4" />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    side="top"
                    sideOffset={6}
                    collisionPadding={12}
                    className="z-50 max-w-64 origin-(--radix-popover-content-transform-origin) rounded-xl border bg-popover px-3 py-2 text-sm text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=closed]:duration-150 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-99 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-96"
                >
                    {help}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
