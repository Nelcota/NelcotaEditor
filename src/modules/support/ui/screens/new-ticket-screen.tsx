import { useForm, useStore } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { invalidateSupportQueries } from "#/modules/support/model/support-queries";
import { MAX_MESSAGE_LENGTH, newTicketSchema } from "#/modules/support/model/support-ticket";
import type { NewTicketInput } from "#/modules/support/model/support-ticket";
import { openSupportTicket } from "#/modules/support/server/support-functions";
import { TicketVideoField } from "#/modules/support/ui/components/ticket-video-field";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { PageHeader } from "#/shared/ui/page-header";
import { TextAreaField } from "#/shared/ui/text-area-field";
import { TextField } from "#/shared/ui/text-field";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { useUnsavedChangesGuard } from "#/shared/ui/use-unsaved-changes-guard";

const FIELD_NAMES = ["subject", "videoId", "message"] as const;
const FALLBACK_ERROR_MESSAGE =
    "Não foi possível enviar o ticket. Confira sua conexão e tente de novo.";

/** Starts empty, or with a video when it comes from "Relatar problema" on a failed video. */
function useNewTicketForm(videoId: string | null) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const defaultValues: NewTicketInput = { subject: "", videoId, message: "" };
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

/** Abrir ticket: subject, the video it is about, and what happened. */
export function NewTicketScreen({ videoId }: { videoId: string | null }): ReactNode {
    const track = useTrackPromise();
    const { form, errorMessage } = useNewTicketForm(videoId);

    return (
        <div className="grid gap-6">
            <PageHeader title="Abrir ticket" description="Conte o que aconteceu para o suporte." />
            <form
                noValidate
                className="grid max-w-xl gap-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    track(form.handleSubmit());
                }}
            >
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
                            hint={`Até ${MAX_MESSAGE_LENGTH} caracteres.`}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onValueChange={field.handleChange}
                            errors={toErrorMessages(field.state.meta.errors)}
                        />
                    )}
                </form.Field>
                <FormAlert message={errorMessage} />
                <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild variant="ghost" className="text-muted-foreground">
                        <Link to="/support">Cancelar</Link>
                    </Button>
                    <form.Subscribe selector={(state) => state.isSubmitting}>
                        {(isSubmitting) => (
                            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                                Enviar ticket
                            </Button>
                        )}
                    </form.Subscribe>
                </div>
            </form>
        </div>
    );
}
