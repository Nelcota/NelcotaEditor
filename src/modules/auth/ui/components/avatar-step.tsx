import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { toAvatar } from "#/modules/auth/model/avatar";
import type { Avatar } from "#/modules/auth/model/avatar";
import { applyAvatarChange } from "#/modules/auth/client/apply-avatar-change";
import { AvatarMascotPicker } from "#/modules/auth/ui/components/avatar-mascot-picker";
import { AvatarPhotoPanel } from "#/modules/auth/ui/components/avatar-photo-panel";
import { forgetCurrentUser } from "#/modules/auth/model/current-user-query";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const appRoute = getRouteApi("/_app");
const CHANGE_FAILED_MESSAGE =
    "Não foi possível trocar a foto. Confira sua conexão e tente de novo.";

function toSelectedMascot(avatar: Avatar): number | null {
    if (avatar.kind !== "mascot") {
        return null;
    }

    return avatar.index;
}

/**
 * The photo step of the profile dialog: upload a photo or pick a mascot. Each choice saves at once,
 * so there is nothing to confirm; a failure from an earlier visit goes away with the step.
 */
export function AvatarStep(): ReactNode {
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
    let errorMessage: string | null = null;

    if (change.error !== null) {
        errorMessage = toErrorMessage(change.error, CHANGE_FAILED_MESSAGE);
    }

    return (
        <div className="grid gap-8 md:grid-cols-[12rem_minmax(0,1fr)]">
            <AvatarPhotoPanel
                user={user}
                hasAvatar={avatar.kind !== "initials"}
                isBusy={change.isPending}
                isUploading={isUploading}
                errorMessage={errorMessage}
                onUpload={(file) => change.mutate({ kind: "upload", file })}
                onRemove={() => change.mutate({ kind: "remove" })}
            />
            <AvatarMascotPicker
                selectedIndex={toSelectedMascot(avatar)}
                isBusy={change.isPending}
                onPick={(index) => change.mutate({ kind: "mascot", index })}
            />
        </div>
    );
}
