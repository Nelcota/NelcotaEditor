import { useForm, useStore } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { invalidateSupportQueries } from "#/modules/support/model/support-queries";
import {
    MAX_MESSAGE_LENGTH,
    TICKET_TOPIC_LABELS,
    newTicketSchema,
} from "#/modules/support/model/support-ticket";
import type { NewTicketInput, TicketTopic } from "#/modules/support/model/support-ticket";
import { openSupportTicket } from "#/modules/support/server/support-functions";
import { TicketTopicIcon } from "#/modules/support/ui/components/ticket-topic-icon";
import { TicketVideoField } from "#/modules/support/ui/components/ticket-video-field";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { TextAreaField } from "#/shared/ui/text-area-field";
import { TextField } from "#/shared/ui/text-field";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { useUnsavedChangesGuard } from "#/shared/ui/use-unsaved-changes-guard";

const FIELD_NAMES = ["subject", "videoId", "message"] as const;
const FALLBACK_ERROR_MESSAGE =
    "Não foi possível iniciar a conversa. Confira sua conexão e tente de novo.";

export interface NewTicketDraft {
    topic: TicketTopic;
    videoId: string | null;
}

/** Starts empty, or with a video when it comes from "Relatar problema" on a failed video. */
function useNewTicketForm({ topic, videoId }: NewTicketDraft) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const defaultValues: NewTicketInput = { topic, subject: "", videoId, message: "" };
    const form = useForm({
        defaultValues,
        validators: { onSubmit: newTicketSchema },
        onSubmitInvalid: ({ formApi }) => focusFirstInvalidField(FIELD_NAMES, formApi),
        onSubmit: async ({ value }) => {
            setErrorMessage(null);
            let ticketId = "";

            try {
                ticketId = (await openSupportTicket({ data: value })).ticketId;
            } catch (error) {
                setErrorMessage(toErrorMessage(error, FALLBACK_ERROR_MESSAGE));
                return;
            }

            allowLeave();
            await invalidateSupportQueries(queryClient);
            await navigate({ to: "/support/$ticketId", params: { ticketId } });
        },
    });
    const isDirty = useStore(form.store, (state) => state.isDirty);
    const allowLeave = useUnsavedChangesGuard(isDirty);

    return { form, errorMessage };
}

function ChosenTopic({ draft }: { draft: NewTicketDraft }): ReactNode {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary-solid text-primary-foreground [&>svg]:size-4">
                <TicketTopicIcon topic={draft.topic} />
            </span>
            <p className="font-bold">Área: {TICKET_TOPIC_LABELS[draft.topic]}</p>
            <Link
                to="/support/new"
                search={{ videoId: draft.videoId ?? undefined }}
                className="rounded-sm text-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring"
            >
                Trocar
            </Link>
        </div>
    );
}

/** The conversation's first message once the area is picked: subject, video and what happened. */
export function NewTicketForm({ draft }: { draft: NewTicketDraft }): ReactNode {
    const track = useTrackPromise();
    const { form, errorMessage } = useNewTicketForm(draft);

    return (
        <form
            noValidate
            className="grid max-w-2xl gap-5 rounded-2xl border border-card-border bg-card p-5 sm:p-6"
            onSubmit={(event) => {
                event.preventDefault();
                track(form.handleSubmit());
            }}
        >
            <ChosenTopic draft={draft} />
            <form.Field name="subject">
                {(field) => (
                    <TextField
                        id="subject"
                        label="Assunto"
                        autoComplete="off"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={field.handleChange}
                        errors={toErrorMessages(field.state.meta.errors)}
                    />
                )}
            </form.Field>
            <form.Field name="videoId">
                {(field) => (
                    <TicketVideoField
                        id="videoId"
                        value={field.state.value ?? ""}
                        disabled={false}
                        onValueChange={field.handleChange}
                    />
                )}
            </form.Field>
            <form.Field name="message">
                {(field) => (
                    <TextAreaField
                        id="message"
                        label="Mensagem"
                        hint={`Conte o que aconteceu. Até ${MAX_MESSAGE_LENGTH} caracteres.`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={field.handleChange}
                        errors={toErrorMessages(field.state.meta.errors)}
                    />
                )}
            </form.Field>
            <FormAlert message={errorMessage} />
            <div className="flex flex-wrap items-center justify-end gap-2">
                <Button asChild variant="ghost" className="text-muted-foreground">
                    <Link to="/support">Cancelar</Link>
                </Button>
                <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                        <Button
                            type="submit"
                            className="font-bold"
                            disabled={isSubmitting}
                            aria-busy={isSubmitting}
                        >
                            Iniciar conversa
                        </Button>
                    )}
                </form.Subscribe>
            </div>
        </form>
    );
}
