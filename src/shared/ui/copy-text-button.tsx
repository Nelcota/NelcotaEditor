import CircleCheckIcon from "~icons/lucide/circle-check";
import CopyIcon from "~icons/lucide/copy";
import CircleAlertIcon from "~icons/lucide/circle-alert";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";
import { reportClientProblem } from "#/shared/errors/report-client-problem";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

type CopyState = "idle" | "copied" | "failed";

const FEEDBACK_MILLISECONDS = 2_000;
const COPIED_LABEL = "Copiado";
const FAILED_LABEL = "Não deu para copiar";

interface CopyTextButtonProps {
    text: string | (() => string);
    label: string;
    className?: string;
    /** E.g. `max-sm:sr-only` for an icon-only button on phones; the icon still shows each state. */
    labelClassName?: string;
}

function toLabel(state: CopyState, idleLabel: string): string {
    if (state === "copied") {
        return COPIED_LABEL;
    }

    if (state === "failed") {
        return FAILED_LABEL;
    }

    return idleLabel;
}

const STATE_ICONS: Record<CopyState, ReactNode> = {
    idle: <CopyIcon aria-hidden="true" />,
    copied: <CircleCheckIcon className="text-success" aria-hidden="true" />,
    failed: <CircleAlertIcon className="text-destructive" aria-hidden="true" />,
};

/** Copies text to the clipboard; says so for a moment, and says it when the browser refuses. */
export function CopyTextButton({
    text,
    label,
    className,
    labelClassName,
}: CopyTextButtonProps): ReactNode {
    const track = useTrackPromise();
    const [state, setState] = useState<CopyState>("idle");

    useEffect(() => {
        if (state === "idle") {
            return undefined;
        }

        const timeout = setTimeout(() => setState("idle"), FEEDBACK_MILLISECONDS);
        return () => clearTimeout(timeout);
    }, [state]);

    const copy = async (): Promise<void> => {
        try {
            let value = text;

            if (typeof value === "function") {
                value = value();
            }

            await navigator.clipboard.writeText(value);
            setState("copied");
        } catch (error) {
            reportClientProblem("Could not copy to the clipboard", error);
            setState("failed");
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={() => track(copy())}
                className={className}
            >
                {STATE_ICONS[state]}
                <span className={labelClassName}>{toLabel(state, label)}</span>
            </Button>
            <span role="status" className="sr-only">
                {state !== "idle" && toLabel(state, label)}
            </span>
        </>
    );
}
