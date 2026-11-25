import ArrowRightIcon from "~icons/lucide/arrow-right";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { TICKET_TOPICS, TICKET_TOPIC_LABELS } from "#/modules/support/model/support-ticket";
import type { TicketTopic } from "#/modules/support/model/support-ticket";
import { TicketTopicIcon } from "#/modules/support/ui/components/ticket-topic-icon";
import { cn } from "#/shared/ui/cn";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const TOPIC_DESCRIPTIONS: Readonly<Record<TicketTopic, string>> = {
    editor: "Formatos Virais, edições, conexão com o Claude.",
    clips: "Meus cortes, Painel, vídeos que travaram.",
};

interface TopicChoiceProps {
    /** A video the conversation is about, kept when the person picks the area. */
    videoId?: string;
    /** The area already picked, drawn as chosen. */
    selected?: TicketTopic;
}

/** The two areas as doors: picking one starts the conversation with that area's team. */
export function TopicChoice({ videoId, selected }: TopicChoiceProps): ReactNode {
    return (
        <ul className="grid gap-3 md:grid-cols-2">
            {TICKET_TOPICS.map((topic) => (
                <li
                    key={topic}
                    className={cn(
                        "relative flex items-center gap-4 rounded-2xl border border-card-border bg-card p-4 transition-[border-color] hover:border-input",
                        selected === topic && "border-primary hover:border-primary",
                    )}
                >
                    <span
                        className={cn(
                            "grid size-11 shrink-0 place-items-center rounded-xl bg-secondary [&>svg]:size-5",
                            selected === topic && "bg-primary-solid text-primary-foreground",
                        )}
                    >
                        <TicketTopicIcon topic={topic} />
                    </span>
                    <div className="grid min-w-0 flex-1 gap-0.5">
                        <Link
                            to="/support/new"
                            search={{ topic, videoId }}
                            aria-current={toAriaCurrent(selected === topic)}
                            className="font-bold outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-4 focus-visible:after:ring-ring motion-safe:active:scale-99"
                        >
                            {TICKET_TOPIC_LABELS[topic]}
                        </Link>
                        <span className="text-meta text-muted-foreground">
                            {TOPIC_DESCRIPTIONS[topic]}
                        </span>
                    </div>
                    <ArrowRightIcon
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground"
                    />
                </li>
            ))}
        </ul>
    );
}
