import ChevronRightIcon from "~icons/lucide/chevron-right";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { AdminUserRow } from "#/modules/admin/model/admin-views";
import { AdminUserBadges } from "#/modules/admin/ui/components/admin-user-badges";
import { toAvatar } from "#/modules/auth/model/avatar";
import { UserAvatar } from "#/shared/ui/user-avatar";
import { formatBytes, formatDate } from "#/shared/ui/format";
import { pluralize } from "#/shared/ui/pluralize";

function describeUsage(user: AdminUserRow): string {
    return [
        `${user.videoCount} ${pluralize(user.videoCount, "vídeo", "vídeos")}`,
        formatBytes(user.storageBytes),
        `desde ${formatDate(user.createdAt)}`,
    ].join(" · ");
}

function UserItem({ user }: { user: AdminUserRow }): ReactNode {
    return (
        <li className="border-b last:border-b-0">
            <Link
                to="/admin/users/$userId"
                params={{ userId: user.id }}
                className="-mx-2 my-1 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2.5 outline-none transition-[background-color,box-shadow,scale] hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
            >
                <UserAvatar name={user.name} avatar={toAvatar(user.image)} className="size-10" />
                <span className="grid min-w-0 gap-0.5">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium [overflow-wrap:anywhere]">{user.name}</span>
                        <AdminUserBadges user={user} />
                    </span>
                    <span className="text-meta text-muted-foreground [overflow-wrap:anywhere]">
                        {user.email}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {describeUsage(user)}
                    </span>
                </span>
                <ChevronRightIcon
                    aria-hidden="true"
                    className="size-5 text-muted-foreground rtl:-scale-x-100"
                />
            </Link>
        </li>
    );
}

export function AdminUserList({ users }: { users: Array<AdminUserRow> }): ReactNode {
    return (
        <ul className="rounded-2xl border bg-popover px-4 sm:px-5">
            {users.map((user) => (
                <UserItem key={user.id} user={user} />
            ))}
        </ul>
    );
}
