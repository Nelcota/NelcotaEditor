import ClapperboardIcon from "~icons/lucide/clapperboard";
import ScissorsIcon from "~icons/lucide/scissors";
import type { ReactNode } from "react";
import type { TicketTopic } from "#/modules/support/model/support-ticket";
import type { IconComponent } from "#/shared/ui/icon-component";

/** The same icons the sidebar gives each area: Formatos Virais and Meus cortes. */
const TOPIC_ICONS: Readonly<Record<TicketTopic, IconComponent>> = {
    editor: ClapperboardIcon,
    clips: ScissorsIcon,
};

export function TicketTopicIcon({
    topic,
    className,
}: {
    topic: TicketTopic;
    className?: string;
}): ReactNode {
    const Icon = TOPIC_ICONS[topic];

    return <Icon aria-hidden="true" className={className} />;
}
