import ArrowLeftIcon from "~icons/lucide/arrow-left";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";

/** The footer's way back one step, quieter than the step's own action. */
export function StepBackButton({ onClick }: { onClick: () => void }): ReactNode {
    return (
        <Button type="button" variant="ghost" onClick={onClick} className="text-muted-foreground">
            <ArrowLeftIcon aria-hidden="true" />
            Voltar
        </Button>
    );
}
