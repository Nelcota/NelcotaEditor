import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SECTION_LINK_ACTIVE_OPTIONS } from "#/modules/shell/model/nav-sections";
import type { NavSection, NavSectionState } from "#/modules/shell/model/nav-sections";
import { SectionIcon } from "#/modules/shell/ui/components/section-icon";
import { cn } from "#/shared/ui/cn";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const TAB_CLASS =
    "relative grid h-16 content-center justify-items-center gap-1 text-xs font-medium text-muted-foreground outline-none transition-[color,scale] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring motion-safe:active:scale-[0.99] [&>svg]:size-6";

const STATE_CLASSES: Record<NavSectionState, string> = {
    current: "text-primary-ink",
    parent: "text-primary-ink",
    none: "",
};

interface SectionTabLinkProps {
    section: NavSection;
    state: NavSectionState;
    hasActivity: boolean;
    className?: string;
}

/** A section as an icon with its name under it, for the phone tab bar and the desktop rail. */
export function SectionTabLink({
    section,
    state,
    hasActivity,
    className,
}: SectionTabLinkProps): ReactNode {
    return (
        <Link
            to={section.path}
            activeOptions={SECTION_LINK_ACTIVE_OPTIONS}
            aria-current={toAriaCurrent(state === "current")}
            className={cn(TAB_CLASS, STATE_CLASSES[state], className)}
        >
            <SectionIcon section={section} state={state} />
            {section.label}
            {hasActivity === true && (
                <>
                    <span
                        aria-hidden="true"
                        className="absolute top-3 start-[calc(50%+8px)] size-2 rounded-full bg-primary ring-2 ring-background"
                    />
                    <span className="sr-only">, processando</span>
                </>
            )}
        </Link>
    );
}
