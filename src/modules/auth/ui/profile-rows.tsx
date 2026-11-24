import CameraIcon from "~icons/lucide/camera";
import CheckIcon from "~icons/lucide/check";
import KeyRoundIcon from "~icons/lucide/key-round";
import LogOutIcon from "~icons/lucide/log-out";
import PenIcon from "~icons/lucide/pen";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { AvatarDialog } from "#/modules/auth/ui/avatar-dialog";
import { ChangePasswordDialog } from "#/modules/auth/ui/change-password-dialog";
import { EditProfileDialog } from "#/modules/auth/ui/edit-profile-dialog";
import { UserAvatar } from "#/modules/auth/ui/user-avatar";
import { useSignOut } from "#/modules/auth/ui/use-sign-out";
import { Button } from "#/shared/ui/button";
import { SettingsRow } from "#/shared/ui/settings-row";

const appRoute = getRouteApi("/_app");

type OpenDialog = "photo" | "profile" | "password" | null;

function AvatarButton({ onClick }: { onClick: () => void }): ReactNode {
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Trocar foto de perfil"
            className="group relative shrink-0 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
        >
            <UserAvatar
                name={user.name}
                image={user.image}
                className="size-14 text-base transition-opacity group-hover:opacity-85"
            />
            <span className="absolute -end-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full bg-foreground text-background ring-2 ring-background">
                <CameraIcon className="size-3.5" aria-hidden="true" />
            </span>
        </button>
    );
}

function PasswordLine({ hasChanged }: { hasChanged: boolean }): ReactNode {
    if (hasChanged === false) {
        return "Para entrar no Nelcota";
    }

    return (
        <span role="status" className="inline-flex items-center gap-1.5">
            <CheckIcon className="size-3.5 text-success" aria-hidden="true" />
            Senha trocada
        </span>
    );
}

/** The Perfil group's rows: who is signed in (photo, name, email), the password and the session. */
export function ProfileRows(): ReactNode {
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;
    const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
    const [hasChangedPassword, setHasChangedPassword] = useState(false);
    const { signOut, isSigningOut, errorMessage } = useSignOut();
    let sessionLine: ReactNode = "Neste navegador";

    if (errorMessage !== null) {
        sessionLine = (
            <span role="alert" className="text-destructive">
                {errorMessage}
            </span>
        );
    }

    const toOpenChange =
        (dialog: OpenDialog): ((isOpen: boolean) => void) =>
        (isOpen: boolean): void => {
            if (isOpen === false) {
                setOpenDialog(null);
                return;
            }

            setOpenDialog(dialog);
        };

    return (
        <>
            <SettingsRow
                art={<AvatarButton onClick={() => setOpenDialog("photo")} />}
                label={
                    <span title={user.name} className="block truncate text-base">
                        {user.name}
                    </span>
                }
                description={
                    <span title={user.email} className="block truncate">
                        {user.email}
                    </span>
                }
                className="py-4"
            >
                <Button variant="secondary" size="sm" onClick={() => setOpenDialog("profile")}>
                    <PenIcon aria-hidden="true" />
                    Editar perfil
                </Button>
            </SettingsRow>
            <SettingsRow
                label="Senha"
                description={<PasswordLine hasChanged={hasChangedPassword} />}
            >
                <Button variant="secondary" size="sm" onClick={() => setOpenDialog("password")}>
                    <KeyRoundIcon aria-hidden="true" />
                    Trocar senha
                </Button>
            </SettingsRow>
            <SettingsRow label="Sessão" description={sessionLine}>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                        await signOut();
                    }}
                    disabled={isSigningOut}
                    aria-busy={isSigningOut}
                >
                    <LogOutIcon aria-hidden="true" />
                    Sair
                </Button>
            </SettingsRow>
            <AvatarDialog isOpen={openDialog === "photo"} onOpenChange={toOpenChange("photo")} />
            <EditProfileDialog
                isOpen={openDialog === "profile"}
                onOpenChange={toOpenChange("profile")}
            />
            <ChangePasswordDialog
                isOpen={openDialog === "password"}
                onOpenChange={toOpenChange("password")}
                onChanged={() => {
                    setOpenDialog(null);
                    setHasChangedPassword(true);
                }}
            />
        </>
    );
}
