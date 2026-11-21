import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { toAvatar } from "#/modules/auth/avatar";
import type { Avatar } from "#/modules/auth/avatar";
import { applyAvatarChange } from "#/modules/auth/client/apply-avatar-change";
import { AvatarMascotPicker } from "#/modules/auth/ui/avatar-mascot-picker";
import { forgetCurrentUser } from "#/modules/auth/ui/current-user-query";
import { AvatarPhotoPanel } from "#/modules/auth/ui/avatar-photo-panel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "#/shared/ui/dialog";

const appRoute = getRouteApi("/_app");

function toSelectedMascot(avatar: Avatar): number | null {
    if (avatar.kind !== "mascot") {
        return null;
    }

    return avatar.index;
}

interface AvatarDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function AvatarDialog({ isOpen, onOpenChange }: AvatarDialogProps): ReactNode {
    const router = useRouter();
    const queryClient = useQueryClient();
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;
    const avatar = toAvatar(user.image);
    const change = useMutation({
        mutationFn: applyAvatarChange,
        // The signed-in user lives in the route context (and its cache), so reload it to show the
        // new avatar.
        onSuccess: async () => {
            await forgetCurrentUser(queryClient);
            await router.invalidate();
        },
    });
    const isUploading = change.isPending && change.variables.kind === "upload";

    const handleOpenChange = (isNowOpen: boolean): void => {
        // A failure from the last time should not greet the person when they come back.
        change.reset();
        onOpenChange(isNowOpen);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="gap-6 [--dialog-padding:--spacing(8)] sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Foto de perfil</DialogTitle>
                    <DialogDescription>Envie uma foto ou use um mascote.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-8 sm:grid-cols-[13rem_minmax(0,1fr)]">
                    <AvatarPhotoPanel
                        user={user}
                        hasAvatar={avatar.kind !== "initials"}
                        isBusy={change.isPending}
                        isUploading={isUploading}
                        errorMessage={change.error?.message ?? null}
                        onUpload={(file) => change.mutate({ kind: "upload", file })}
                        onRemove={() => change.mutate({ kind: "remove" })}
                    />
                    <AvatarMascotPicker
                        selectedIndex={toSelectedMascot(avatar)}
                        isBusy={change.isPending}
                        onPick={(index) => change.mutate({ kind: "mascot", index })}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
