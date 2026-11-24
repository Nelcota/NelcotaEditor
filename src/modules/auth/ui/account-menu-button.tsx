import MenuIcon from "~icons/lucide/menu";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { AccountMenuContent } from "#/modules/auth/ui/account-menu-content";
import { AvatarDialog } from "#/modules/auth/ui/avatar-dialog";
import { UserAvatar } from "#/modules/auth/ui/user-avatar";
import { DropdownMenu, DropdownMenuTrigger } from "#/shared/ui/dropdown-menu";

const appRoute = getRouteApi("/_app");

/**
 * Who is signed in, at the foot of the sidebar: photo, name and the menu glyph of a menu that
 * opens Conta, the photo and the way out.
 */
export function AccountMenuButton(): ReactNode {
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    aria-label={`Menu da conta: ${user.name}`}
                    className="flex h-11 w-full items-center gap-2.5 rounded-xl px-2 text-start outline-none transition-[background-color,scale] hover:bg-foreground/5 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] data-[state=open]:bg-foreground/5"
                >
                    <UserAvatar name={user.name} image={user.image} className="size-7" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {user.name}
                    </span>
                    <MenuIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <AccountMenuContent
                    side="top"
                    align="start"
                    className="w-64"
                    hasAccountLink
                    onChangePhoto={() => setIsPhotoDialogOpen(true)}
                />
            </DropdownMenu>
            <AvatarDialog isOpen={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen} />
        </>
    );
}
