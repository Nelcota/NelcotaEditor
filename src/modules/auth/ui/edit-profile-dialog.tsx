import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { profileNameSchema } from "#/modules/auth/auth-forms.schema";
import { renameUser } from "#/modules/auth/server/profile-functions";
import { forgetCurrentUser } from "#/modules/auth/ui/current-user-query";
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
import { Input } from "#/shared/ui/input";
import { Label } from "#/shared/ui/label";
import { TextField } from "#/shared/ui/text-field";

const appRoute = getRouteApi("/_app");

function toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "Não foi possível salvar o nome. Tente novamente.";
}

function ReadOnlyEmail({ email }: { email: string }): ReactNode {
    return (
        <div className="grid gap-2">
            <Label htmlFor="profile-email">E-mail</Label>
            <Input
                id="profile-email"
                value={email}
                readOnly
                className="h-11 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
                É o e-mail de entrada; não dá para trocar por aqui.
            </p>
        </div>
    );
}

function EditProfileForm({ onDone }: { onDone: () => void }): ReactNode {
    const router = useRouter();
    const queryClient = useQueryClient();
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { name: user.name },
        validators: { onSubmit: profileNameSchema },
        onSubmit: async ({ value }) => {
            setErrorMessage(null);

            try {
                await renameUser({ data: value });
            } catch (error) {
                setErrorMessage(toErrorMessage(error));
                return;
            }

            // The signed-in user lives in the route context (and its cache), so reload it to show
            // the new name.
            await forgetCurrentUser(queryClient);
            await router.invalidate();
            onDone();
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
            <form.Field name="name">
                {(field) => (
                    <TextField
                        id="profile-name"
                        label="Nome"
                        autoComplete="name"
                        autoCapitalize="words"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={field.handleChange}
                        errors={toErrorMessages(field.state.meta.errors)}
                    />
                )}
            </form.Field>
            <ReadOnlyEmail email={user.email} />
            <FormAlert message={errorMessage} />
            <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                    <Button
                        type="submit"
                        size="lg"
                        className="justify-self-end font-semibold"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                    >
                        Salvar nome
                    </Button>
                )}
            </form.Subscribe>
        </form>
    );
}

interface EditProfileDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function EditProfileDialog({ isOpen, onOpenChange }: EditProfileDialogProps): ReactNode {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar perfil</DialogTitle>
                    <DialogDescription>O nome aparece na barra lateral.</DialogDescription>
                </DialogHeader>
                <EditProfileForm onDone={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
