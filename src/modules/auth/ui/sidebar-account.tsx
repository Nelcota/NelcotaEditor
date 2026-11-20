import MenuDotsIcon from "~icons/solar/menu-dots-linear";
import { Link, getRouteApi, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { AccountMenuContent } from "#/modules/auth/ui/account-menu-content";
import { AvatarDialog } from "#/modules/auth/ui/avatar-dialog";
import { UserAvatar } from "#/modules/auth/ui/user-avatar";
import { cn } from "#/shared/ui/cn";
import { DropdownMenu, DropdownMenuTrigger } from "#/shared/ui/dropdown-menu";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const appRoute = getRouteApi("/_app");
const ACCOUNT_PATH = "/account";

/**
 * The profile photo, name and e-mail at the bottom of the sidebar. The card opens the account page;
 * the dots open the menu. Collapsed there is room for one control, so the avatar opens the menu,
 * which then also links to the account page.
 */
export function SidebarAccount({ isCollapsed }: { isCollapsed: boolean }): ReactNode {
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;
    const pathname = useLocation({ select: (location) => location.pathname });
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
    const isAccountPage = pathname === ACCOUNT_PATH;

    return (
        <>
            <DropdownMenu>
                <div
                    className={cn(
                        "flex w-full min-w-0 items-center rounded-xl border transition-colors",
                        isAccountPage === true && "bg-accent",
                        isCollapsed === true && "justify-center border-transparent",
                    )}
                >
                    {isCollapsed === false && (
                        <Link
                            to={ACCOUNT_PATH}
                            aria-current={toAriaCurrent(isAccountPage)}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left outline-none transition-colors hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99]"
                        >
                            <UserAvatar name={user.name} image={user.image} className="size-10" />
                            <span className="grid min-w-0 flex-1">
                                <span className="truncate text-sm font-bold">{user.name}</span>
                                <span className="truncate text-[14px] text-muted-foreground">
                                    {user.email}
                                </span>
                            </span>
                        </Link>
                    )}
                    <DropdownMenuTrigger
                        aria-label={`Menu da conta: ${user.name}`}
                        className={cn(
                            "grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99] data-[state=open]:bg-secondary",
                            isCollapsed === true && "size-auto",
                        )}
                    >
                        {isCollapsed === true && (
                            <UserAvatar name={user.name} image={user.image} className="size-10" />
                        )}
                        {isCollapsed === false && (
                            <MenuDotsIcon className="size-4" aria-hidden="true" />
                        )}
                    </DropdownMenuTrigger>
                </div>
                <AccountMenuContent
                    side="right"
                    align="end"
                    className="w-64"
                    hasAccountLink={isCollapsed}
                    onChangePhoto={() => setIsPhotoDialogOpen(true)}
                />
            </DropdownMenu>
            <AvatarDialog isOpen={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen} />
        </>
    );
}
