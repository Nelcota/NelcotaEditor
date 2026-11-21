import ShieldUserIcon from "~icons/solar/shield-user-linear";
import UserBlockIcon from "~icons/solar/user-block-linear";
import type { ReactNode } from "react";
import type { AdminUserRow } from "#/modules/admin/admin-views";

const BADGE_CLASS =
    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold [&>svg]:size-4";

/** Only the states that matter to an admin get a badge; a plain active account has none. */
export function AdminUserBadges({ user }: { user: AdminUserRow }): ReactNode {
    return (
        <>
            {user.isAdmin === true && (
                <span className={`${BADGE_CLASS} bg-primary/15 text-primary`}>
                    <ShieldUserIcon aria-hidden="true" />
                    Admin
                </span>
            )}
            {user.isBanned === true && (
                <span className={`${BADGE_CLASS} bg-destructive/15 text-destructive`}>
                    <UserBlockIcon aria-hidden="true" />
                    Bloqueada
                </span>
            )}
        </>
    );
}
