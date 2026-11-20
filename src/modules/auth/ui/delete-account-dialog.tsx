import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { deleteAccountSchema } from "#/modules/auth/auth-forms.schema";
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

function DeleteAccountForm(): ReactNode {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { password: "" },
        validators: { onSubmit: deleteAccountSchema },
        onSubmit: async ({ value }) => {
            setErrorMessage(null);
            // Better Auth checks the password again on the server before deleting anything.
            const failure = await runAuthRequest(() =>
                authClient.deleteUser({ password: value.password }),
            );

            if (failure !== null) {
                setErrorMessage(failure);
                return;
            }

            await router.navigate({ to: "/sign-up" });
            // The cached videos and clips belonged to the account that no longer exists.
            queryClient.clear();
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
            <form.Field name="password">
                {(field) => (
                    <TextField
                        id="delete-account-password"
                        label="Senha"
                        type="password"
                        autoComplete="current-password"
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
                        variant="destructive"
                        className="justify-self-end"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                    >
                        Excluir conta para sempre
                    </Button>
                )}
            </form.Subscribe>
        </form>
    );
}

interface DeleteAccountDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

/** Permanent, so it names what goes away and asks for the password. */
export function DeleteAccountDialog({ isOpen, onOpenChange }: DeleteAccountDialogProps): ReactNode {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Excluir sua conta?</DialogTitle>
                    <DialogDescription>
                        Todos os seus vídeos, cortes, transcrições e a foto de perfil serão
                        apagados. Isso não pode ser desfeito.
                    </DialogDescription>
                </DialogHeader>
                <DeleteAccountForm />
            </DialogContent>
        </Dialog>
    );
}
