import CheckCircleIcon from "~icons/solar/check-circle-linear";
import CopyIcon from "~icons/solar/copy-linear";
import { useEffect, useState } from "react";
import { Button } from "#/shared/ui/button";

type CopyState = "idle" | "copied" | "failed";

const FEEDBACK_MILLISECONDS = 2_000;
const COPIED_LABEL = "Copiado";
const FAILED_LABEL = "Não deu para copiar";

interface CopyTextButtonProps {
    text: string;
    label: string;
    className?: string;
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

/** Copies text to the clipboard; says so for a moment, and says it when the browser refuses. */
export function CopyTextButton({ text, label, className }: CopyTextButtonProps) {
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
            await navigator.clipboard.writeText(text);
            setState("copied");
        } catch (error) {
            console.warn("Could not copy to the clipboard", error);
            setState("failed");
        }
    };

    return (
        <Button variant="outline" onClick={copy} aria-live="polite" className={className}>
            {state === "copied" && <CheckCircleIcon className="text-success" aria-hidden="true" />}
            {state !== "copied" && <CopyIcon aria-hidden="true" />}
            {toLabel(state, label)}
        </Button>
    );
}
