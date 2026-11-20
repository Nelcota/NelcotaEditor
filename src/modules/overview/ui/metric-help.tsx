import InfoCircleIcon from "~icons/solar/info-circle-linear";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/shared/ui/tooltip";

export function MetricHelp({ label, help }: { label: string; help: string }) {
    return (
        <Tooltip>
            <TooltipTrigger
                aria-label={`Sobre ${label}`}
                className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none motion-safe:active:scale-[0.99]"
            >
                <InfoCircleIcon aria-hidden="true" className="size-4" />
            </TooltipTrigger>
            <TooltipContent>{help}</TooltipContent>
        </Tooltip>
    );
}
