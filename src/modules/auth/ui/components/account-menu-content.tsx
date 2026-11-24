import ImageUpIcon from "~icons/lucide/image-up";
import LogOutIcon from "~icons/lucide/log-out";
import ShieldIcon from "~icons/lucide/shield";
import UserIcon from "~icons/lucide/user";
import { Link, getRouteApi } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { UserAvatar } from "#/modules/auth/ui/components/user-avatar";
import { useSignOut } from "#/modules/auth/ui/hooks/use-sign-out";
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "#/shared/ui/dropdown-menu";

const appRoute = getRouteApi("/_app");

interface AccountMenuContentProps extends Pick<
    ComponentProps<typeof DropdownMenuContent>,
    "side" | "align" | "className"
> {
    onChangePhoto: () => void;
    /** Only where the account card is not visible to link to the page itself. */
    hasAccountLink: boolean;
}

function SignOutError({ message }: { message: string | null }): ReactNode {
    if (message === null) {
        return null;
    }

    return (
        <p role="alert" className="px-2.5 pb-2 text-xs text-destructive">
            {message}
        </p>
    );
}

/** Who is signed in, the profile photo and the way out; shared by every account trigger. */
export function AccountMenuContent({
    onChangePhoto,
    hasAccountLink,
    ...contentProps
}: AccountMenuContentProps): ReactNode {
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;
    const { signOut, isSigningOut, errorMessage } = useSignOut();

    return (
        <DropdownMenuContent {...contentProps}>
            <div className="flex items-center gap-2.5 px-2.5 py-2">
                <UserAvatar name={user.name} image={user.image} />
                <div className="min-w-0">
                    <p title={user.name} className="text-sm font-semibold [overflow-wrap:anywhere]">
                        {user.name}
                    </p>
                    <p
                        title={user.email}
                        className="text-xs text-muted-foreground [overflow-wrap:anywhere]"
                    >
                        {user.email}
                    </p>
                </div>
            </div>
            <DropdownMenuSeparator />
            {hasAccountLink === true && (
                <DropdownMenuItem asChild>
                    <Link to="/account">
                        <UserIcon aria-hidden="true" />
                        Conta
                    </Link>
                </DropdownMenuItem>
            )}
            {/* Phones have no room for Admin in the tab bar, so it lives here. */}
            {user.isAdmin === true && (
                <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/admin">
                        <ShieldIcon aria-hidden="true" />
                        Admin
                    </Link>
                </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onChangePhoto}>
                <ImageUpIcon aria-hidden="true" />
                Trocar foto de perfil
            </DropdownMenuItem>
            <DropdownMenuItem
                disabled={isSigningOut}
                aria-busy={isSigningOut}
                onSelect={async (event) => {
                    // Keeps the menu open, so a failure can be shown next to the item.
                    event.preventDefault();
                    await signOut();
                }}
            >
                <LogOutIcon aria-hidden="true" />
                Sair
            </DropdownMenuItem>
            <SignOutError message={errorMessage} />
        </DropdownMenuContent>
    );
}
