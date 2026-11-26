import type { ReactNode } from "react";
import type { TicketTopic } from "#/modules/support/model/support-ticket";
import { NewTicketForm } from "#/modules/support/ui/components/new-ticket-form";
import { TopicChoice } from "#/modules/support/ui/components/topic-choice";

interface NewTicketScreenProps {
    /** Null until the person picks the area; the page asks for it first. */
    topic: TicketTopic | null;
    videoId: string | null;
}

/** Nova conversa: the area first, then what is happening. */
export function NewTicketScreen({ topic, videoId }: NewTicketScreenProps): ReactNode {
    return (
        <div className="grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-8">
            <header className="grid max-w-2xl gap-2">
                <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Nova conversa
                </p>
                <h1 className="text-title font-extrabold tracking-[-0.02em] sm:text-4xl">
                    Conte o que está acontecendo
                </h1>
                <p className="max-w-xl text-pretty text-muted-foreground">
                    A equipe responde aqui e avisa por e-mail.
                </p>
            </header>
            {topic === null && <TopicChoice videoId={videoId ?? undefined} />}
            {topic !== null && <NewTicketForm key={topic} draft={{ topic, videoId }} />}
        </div>
    );
}
