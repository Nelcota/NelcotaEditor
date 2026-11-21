import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import type { ReactNode } from "react";
import { changePasswordSchema, NEW_PASSWORD_HINT } from "#/modules/auth/auth-forms.schema";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { Button } from "#/shared/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "#/shared/ui/dialog";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextField } from "#/shared/ui/text-field";

function ChangePasswordForm({ onChanged }: { onChanged: () => void }): ReactNode {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { currentPassword: "", newPassword: "" },
        validators: { onSubmit: changePasswordSchema },
        onSubmit: async ({ value }) => {
            setErrorMessage(null);
            // Better Auth checks the current password and the new one's length again on the server.
            const failure = await runAuthRequest(() =>
                authClient.changePassword({ ...value, revokeOtherSessions: true }),
            );

            if (failure !== null) {
                setErrorMessage(failure);
                return;
            }

            onChanged();
        },
    });

    return (
        <form
            noValidate
            className="grid gap-4"
            onSubmit={async (event) => {
                event.preventDefault();
                await form.handleSubmit();
            }}
        >
            <form.Field name="currentPassword">
                {(field) => (
                    <TextField
                        id="current-password"
                        label="Senha atual"
                        type="password"
                        autoComplete="current-password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={field.handleChange}
                        errors={toErrorMessages(field.state.meta.errors)}
                    />
                )}
            </form.Field>
            <form.Field name="newPassword">
                {(field) => (
                    <TextField
                        id="new-password"
                        label="Senha nova"
                        type="password"
                        autoComplete="new-password"
                        hint={NEW_PASSWORD_HINT}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={field.handleChange}
                        errors={toErrorMessages(field.state.meta.errors)}
                    />
                )}
            </form.Field>
            <FormAlert message={errorMessage} />
            <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                    <Button
                        type="submit"
                        size="lg"
                        className="justify-self-end font-medium"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                    >
                        Trocar senha
                    </Button>
                )}
            </form.Subscribe>
        </form>
    );
}

interface ChangePasswordDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onChanged: () => void;
}

export function ChangePasswordDialog({
    isOpen,
    onOpenChange,
    onChanged,
}: ChangePasswordDialogProps): ReactNode {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Trocar senha</DialogTitle>
                    <DialogDescription>
                        Por segurança, os outros aparelhos onde você entrou saem da conta.
                    </DialogDescription>
                </DialogHeader>
                <ChangePasswordForm onChanged={onChanged} />
            </DialogContent>
        </Dialog>
    );
}
