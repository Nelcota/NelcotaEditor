import ChevronDownIcon from "~icons/lucide/chevron-down";
import ChevronUpIcon from "~icons/lucide/chevron-up";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { AccountMenuContent } from "#/modules/auth/ui/account-menu-content";
import { AvatarDialog } from "#/modules/auth/ui/avatar-dialog";
import { UserAvatar } from "#/modules/auth/ui/user-avatar";
import { DropdownMenu, DropdownMenuTrigger } from "#/shared/ui/dropdown-menu";

const appRoute = getRouteApi("/_app");

/**
 * Who is signed in, at the foot of the sidebar: photo, name and the up/down chevrons of a menu that
 * opens Conta, the photo and the way out. The photo's ring starts on the box line, the name on the
 * text line.
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
                    className="flex h-14 w-full items-center gap-1.5 rounded-xl pe-3 text-start outline-none transition-[background-color,scale] hover:bg-foreground/5 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] data-[state=open]:bg-foreground/5"
                >
                    <UserAvatar
                        name={user.name}
                        image={user.image}
                        className="ms-0.5 size-9 ring-2 ring-foreground"
                    />
                    <span className="min-w-0 flex-1 truncate text-base font-medium">
                        {user.name}
                    </span>
                    <span className="grid text-muted-foreground" aria-hidden="true">
                        <ChevronUpIcon className="-mb-1 size-4" />
                        <ChevronDownIcon className="size-4" />
                    </span>
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
