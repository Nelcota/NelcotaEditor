import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { AccountMenuContent } from "#/modules/auth/ui/account-menu-content";
import { AvatarDialog } from "#/modules/auth/ui/avatar-dialog";
import { UserAvatar } from "#/modules/auth/ui/user-avatar";
import { DropdownMenu, DropdownMenuTrigger } from "#/shared/ui/dropdown-menu";

const appRoute = getRouteApi("/_app");

/** The profile photo at the end of the top bar: it opens Conta, the photo and the way out. */
export function AccountMenuButton(): ReactNode {
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    aria-label={`Menu da conta: ${user.name}`}
                    className="grid size-10 shrink-0 place-items-center rounded-full outline-none transition-[box-shadow,scale,opacity] hover:opacity-85 focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99] data-[state=open]:ring-4 data-[state=open]:ring-secondary"
                >
                    <UserAvatar name={user.name} image={user.image} className="size-10" />
                </DropdownMenuTrigger>
                <AccountMenuContent
                    side="bottom"
                    align="end"
                    className="w-64"
                    hasAccountLink
                    onChangePhoto={() => setIsPhotoDialogOpen(true)}
                />
            </DropdownMenu>
            <AvatarDialog isOpen={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen} />
        </>
    );
}
