import { useForm, useStore } from "@tanstack/react-form";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import { messageBodySchema } from "#/modules/support/model/support-ticket";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { useUnsavedChangesGuard } from "#/shared/ui/use-unsaved-changes-guard";

const FIELD_NAMES = ["reply"] as const;
const replySchema = z.object({ reply: messageBodySchema });
const FALLBACK_ERROR_MESSAGE =
    "Não foi possível enviar a resposta. Confira sua conexão e tente de novo.";

interface TicketReplyCardProps {
    /** The line beside the button: where the answer also goes, or that replying reopens. */
    hint: string;
    /** Sends the text; the box clears only once it resolves. */
    onSend: (message: string) => Promise<void>;
}

function useReplyForm(onSend: TicketReplyCardProps["onSend"]) {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { reply: "" },
        validators: { onSubmit: replySchema },
        onSubmitInvalid: ({ formApi }) => focusFirstInvalidField(FIELD_NAMES, formApi),
        onSubmit: async ({ value, formApi }) => {
            setErrorMessage(null);

            try {
                await onSend(value.reply.trim());
            } catch (error) {
                setErrorMessage(toErrorMessage(error, FALLBACK_ERROR_MESSAGE));
                return;
            }

            formApi.reset();
        },
    });
    useUnsavedChangesGuard(useStore(form.store, (state) => state.isDirty));

    return { form, errorMessage };
}

/** The answer box as one card: the label on top, a borderless text area, the hint and Enviar. */
export function TicketReplyCard({ hint, onSend }: TicketReplyCardProps): ReactNode {
    const track = useTrackPromise();
    const hintId = useId();
    const errorId = useId();
    const { form, errorMessage } = useReplyForm(onSend);

    return (
        <form
            noValidate
            className="grid gap-3 rounded-2xl border border-card-border bg-card p-4 transition-[border-color,box-shadow] focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-ring/30"
            onSubmit={(event) => {
                event.preventDefault();
                track(form.handleSubmit());
            }}
        >
            <form.Field name="reply">
                {(field) => {
                    const errors = toErrorMessages(field.state.meta.errors);
                    const hasErrors = errors.length > 0;

                    return (
                        <div className="grid gap-1.5">
                            <label htmlFor="reply" className="text-sm text-muted-foreground">
                                Responder
                            </label>
                            <textarea
                                id="reply"
                                name="reply"
                                rows={3}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                aria-invalid={hasErrors}
                                aria-describedby={`${hintId} ${errorId}`}
                                className="min-h-20 w-full resize-y bg-transparent text-base outline-none"
                            />
                            <p id={errorId} className="text-sm text-destructive">
                                {errors.join(" ")}
                            </p>
                        </div>
                    );
                }}
            </form.Field>
            <FormAlert message={errorMessage} />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p id={hintId} className="text-meta text-muted-foreground">
                    {hint}
                </p>
                <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                        <Button
                            type="submit"
                            className="font-bold"
                            disabled={isSubmitting}
                            aria-busy={isSubmitting}
                        >
                            Enviar resposta
                        </Button>
                    )}
                </form.Subscribe>
            </div>
        </form>
    );
}
