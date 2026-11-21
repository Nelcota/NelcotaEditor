import type { ReactNode } from "react";
import type { NavSection, NavSectionState } from "#/modules/shell/ui/nav-sections";

interface SectionIconProps {
    section: NavSection;
    state: NavSectionState;
}

/**
 * Lucide has no filled icons, so the section you are in gets a heavier stroke: a cue that does
 * not rest on colour alone. The stroke width lives on the icon's inner elements, hence `*:`.
 */
export function SectionIcon({ section, state }: SectionIconProps): ReactNode {
    const Icon = section.icon;

    if (state === "none") {
        return <Icon aria-hidden="true" />;
    }

    return <Icon aria-hidden="true" className="*:[stroke-width:2.25]" />;
}
