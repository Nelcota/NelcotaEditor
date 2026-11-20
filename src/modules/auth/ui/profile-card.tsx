import CheckIcon from "~icons/solar/check-linear";
import LockPasswordIcon from "~icons/solar/lock-password-linear";
import Logout2Icon from "~icons/solar/logout-2-linear";
import PenIcon from "~icons/solar/pen-linear";
import CameraIcon from "~icons/solar/camera-linear";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { AvatarDialog } from "#/modules/auth/ui/avatar-dialog";
import { ChangePasswordDialog } from "#/modules/auth/ui/change-password-dialog";
import { EditProfileDialog } from "#/modules/auth/ui/edit-profile-dialog";
import { UserAvatar } from "#/modules/auth/ui/user-avatar";
import { useSignOut } from "#/modules/auth/ui/use-sign-out";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";

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
            className="group relative shrink-0 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99]"
        >
            <UserAvatar
                name={user.name}
                image={user.image}
                className="size-18 text-lg transition-opacity group-hover:opacity-85"
            />
            <span className="absolute -right-0.5 -bottom-0.5 grid size-7 place-items-center rounded-full bg-foreground text-background ring-3 ring-popover">
                <CameraIcon className="size-4" aria-hidden="true" />
            </span>
        </button>
    );
}

function PasswordChangedNote(): ReactNode {
    return (
        <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckIcon className="size-4 text-success" aria-hidden="true" />
            Senha trocada
        </p>
    );
}

/** Who is signed in, with everything that changes the person: photo, name, password, sign out. */
export function ProfileCard(): ReactNode {
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;
    const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
    const [hasChangedPassword, setHasChangedPassword] = useState(false);
    const { signOut, isSigningOut, errorMessage } = useSignOut();

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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border bg-popover p-5 sm:p-6">
            <AvatarButton onClick={() => setOpenDialog("photo")} />
            <div className="grid min-w-0 flex-[1_1_10rem] gap-0.5">
                <p className="truncate text-xl font-extrabold tracking-tight">{user.name}</p>
                <p className="truncate text-muted-foreground">{user.email}</p>
                {hasChangedPassword === true && <PasswordChangedNote />}
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
                <Button variant="secondary" onClick={() => setOpenDialog("profile")}>
                    <PenIcon aria-hidden="true" />
                    Editar perfil
                </Button>
                <Button variant="secondary" onClick={() => setOpenDialog("password")}>
                    <LockPasswordIcon aria-hidden="true" />
                    Trocar senha
                </Button>
                <Button
                    variant="ghost"
                    onClick={async () => {
                        await signOut();
                    }}
                    disabled={isSigningOut}
                    aria-busy={isSigningOut}
                >
                    <Logout2Icon aria-hidden="true" />
                    Sair
                </Button>
            </div>
            {errorMessage !== null && (
                <div className="w-full">
                    <FormAlert message={errorMessage} />
                </div>
            )}
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
        </div>
    );
}
