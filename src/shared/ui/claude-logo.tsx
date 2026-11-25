import ClaudeIcon from "~icons/simple-icons/claude";
import type { ReactNode, SVGProps } from "react";
import { cn } from "#/shared/ui/cn";

/**
 * Claude's mark in its own orange, wherever the page talks about the person's Claude. The colour
 * wins over the tint that sidebars and notices give their icons: it is a brand, not a state.
 */
export function ClaudeLogo({ className, ...props }: SVGProps<SVGSVGElement>): ReactNode {
    return <ClaudeIcon aria-hidden="true" {...props} className={cn("text-claude!", className)} />;
}
