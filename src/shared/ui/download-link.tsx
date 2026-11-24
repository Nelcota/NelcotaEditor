import type { ReactNode } from "react";
import DownloadIcon from "~icons/lucide/download";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";

interface DownloadLinkProps {
    /** Null while the file does not exist yet; the link is then left out. */
    href: string | null;
    label: string;
    /** In a list every row has one, so there it is secondary: a screen keeps one primary action. */
    emphasis?: "primary" | "secondary";
    className?: string;
    /** E.g. `max-sm:sr-only` for an icon-only link on phones; the label stays its name. */
    labelClassName?: string;
}

const EMPHASIS_VARIANTS = { primary: "default", secondary: "outline" } as const;

export function DownloadLink(props: DownloadLinkProps): ReactNode {
    const { href, label, emphasis = "primary", className, labelClassName } = props;

    if (href === null) {
        return null;
    }

    return (
        <Button
            asChild
            variant={EMPHASIS_VARIANTS[emphasis]}
            className={cn("font-medium", className)}
        >
            <a href={href} download>
                <DownloadIcon aria-hidden="true" />
                <span className={labelClassName}>{label}</span>
            </a>
        </Button>
    );
}
