import ArrowLeftIcon from "~icons/lucide/arrow-left";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";

interface StepBackButtonProps {
    onClick: () => void;
    /** While the step's work is still being sent, leaving it would hide the result. */
    isDisabled?: boolean;
}

/** The footer's way back one step, quieter than the step's own action. */
export function StepBackButton({ onClick, isDisabled = false }: StepBackButtonProps): ReactNode {
    return (
        <Button
            type="button"
            variant="ghost"
            onClick={onClick}
            disabled={isDisabled}
            className="text-muted-foreground"
        >
            <ArrowLeftIcon aria-hidden="true" />
            Voltar
        </Button>
    );
}
