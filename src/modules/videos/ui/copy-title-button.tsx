import type { ReactNode } from "react";
import { CopyTextButton } from "#/shared/ui/copy-text-button";
import { cn } from "#/shared/ui/cn";

interface CopyTitleButtonProps {
    title: string;
    className?: string;
    labelClassName?: string;
}

/** Copies the clip title to post it. */
export function CopyTitleButton({
    title,
    className,
    labelClassName,
}: CopyTitleButtonProps): ReactNode {
    return (
        <CopyTextButton
            text={title}
            label="Copiar título"
            className={cn("min-w-36", className)}
            labelClassName={labelClassName}
        />
    );
}
