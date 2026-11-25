import { useForm, useStore } from "@tanstack/react-form";
import { useState } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { TextAreaField } from "#/shared/ui/text-area-field";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { useUnsavedChangesGuard } from "#/shared/ui/use-unsaved-changes-guard";

const FIELD_NAMES = ["reply"] as const;
const FALLBACK_ERROR_MESSAGE =
    "Não foi possível enviar a resposta. Confira sua conexão e tente de novo.";

interface ReplyFormProps {
    /** The rules for one message, from the module that owns the conversation. */
    messageSchema: z.ZodType<string, string>;
    label: string;
    hint?: string;
    /** Sends the text; the form clears only once it resolves. */
    onSend: (message: string) => Promise<void>;
    /** Buttons beside Enviar resposta, such as closing the ticket. */
    secondaryAction?: ReactNode;
}

/** The answer box under a conversation: a text box, its errors and Enviar resposta. */
export function ReplyForm({
    messageSchema,
    label,
    hint,
    onSend,
    secondaryAction,
}: ReplyFormProps): ReactNode {
    const track = useTrackPromise();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { reply: "" },
        validators: { onSubmit: z.object({ reply: messageSchema }) },
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

    return (
        <form
            noValidate
            className="grid max-w-3xl gap-3"
            onSubmit={(event) => {
                event.preventDefault();
                track(form.handleSubmit());
            }}
        >
            <form.Field name="reply">
                {(field) => (
                    <TextAreaField
                        id="reply"
                        label={label}
                        hint={hint}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={field.handleChange}
                        errors={toErrorMessages(field.state.meta.errors)}
                    />
                )}
            </form.Field>
            <FormAlert message={errorMessage} />
            <div className="flex flex-wrap justify-end gap-2">
                {secondaryAction}
                <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                            Enviar resposta
                        </Button>
                    )}
                </form.Subscribe>
            </div>
        </form>
    );
}
