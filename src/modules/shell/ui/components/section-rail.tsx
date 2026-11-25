import PanelLeftIcon from "~icons/lucide/panel-left";
import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ActivityBell } from "#/modules/shell/ui/components/activity-bell";
import { SECTION_LINK_ACTIVE_OPTIONS, getSectionState } from "#/modules/shell/model/nav-sections";
import type { NavSection } from "#/modules/shell/model/nav-sections";
import { useNavSections } from "#/modules/shell/ui/hooks/use-nav-sections";
import { BrandMark } from "#/shared/ui/brand-logo";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const SHOW_LABEL = "Abrir a barra lateral";
const RAIL_ITEM_CLASS =
    "grid size-11 place-items-center rounded-xl text-primary-ink outline-none transition-[background-color,scale] hover:bg-foreground/5 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] aria-[current=page]:bg-primary/12 data-[parent=true]:bg-primary/12 [&>svg]:size-5";

function RailLink({ section, pathname }: { section: NavSection; pathname: string }): ReactNode {
    const state = getSectionState(section, pathname);
    const Icon = section.icon;

    return (
        <HintTooltip label={section.label}>
            <Link
                to={section.path}
                activeOptions={SECTION_LINK_ACTIVE_OPTIONS}
                aria-label={section.label}
                aria-current={toAriaCurrent(state === "current")}
                data-parent={state === "parent"}
                className={RAIL_ITEM_CLASS}
            >
                <Icon aria-hidden="true" />
            </Link>
        </HintTooltip>
    );
}

/** The collapsed sidebar (the reference's icon rail): the same sections as icons, with their names on hover. */
export function SectionRail({ onExpand }: { onExpand: () => void }): ReactNode {
    const pathname = useLocation({ select: (location) => location.pathname });
    const sections = useNavSections();

    return (
        <nav aria-label="Seções" className="grid content-start justify-items-center gap-1 pt-3">
            <BrandMark className="mb-2 h-5" isAnimated />
            <ActivityBell />
            <HintTooltip label={SHOW_LABEL}>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onExpand}
                    aria-label={SHOW_LABEL}
                    className="mb-2 text-primary-ink hover:text-primary-ink"
                >
                    <PanelLeftIcon aria-hidden="true" />
                </Button>
            </HintTooltip>
            {sections.map((section) => (
                <RailLink key={section.path} section={section} pathname={pathname} />
            ))}
        </nav>
    );
}
