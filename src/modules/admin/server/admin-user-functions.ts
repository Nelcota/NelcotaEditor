import { createServerFn } from "@tanstack/react-start";
import {
    adminBanInputSchema,
    adminRoleInputSchema,
    adminUserIdInputSchema,
    adminUserListInputSchema,
} from "#/modules/admin/admin-search";
import type { AdminUserDetails, AdminUserPage } from "#/modules/admin/admin-views";
import { adminMiddleware } from "#/modules/admin/server/admin-middleware";
import { findAdminUserDetails, listAdminUsers } from "#/modules/admin/server/admin-users.server";
import { deleteUserAccount } from "#/modules/admin/server/delete-user-account.server";
import { findNonAdminTarget, findTargetUser } from "#/modules/admin/server/find-target-user.server";
import { ADMIN_ROLE, USER_ROLE } from "#/modules/auth/auth.schema";
import { auth } from "#/modules/auth/server/auth.server";

function toRole(isAdmin: boolean): typeof ADMIN_ROLE | typeof USER_ROLE {
    if (isAdmin === true) {
        return ADMIN_ROLE;
    }

    return USER_ROLE;
}

export const getAdminUsers = createServerFn({ method: "GET" })
    .middleware([adminMiddleware])
    .validator(adminUserListInputSchema)
    .handler(async ({ data }): Promise<AdminUserPage> => listAdminUsers(data));

export const getAdminUserDetails = createServerFn({ method: "GET" })
    .middleware([adminMiddleware])
    .validator(adminUserIdInputSchema)
    .handler(async ({ context, data }): Promise<AdminUserDetails> =>
        findAdminUserDetails({ userId: data.userId, adminId: context.admin.id }),
    );

/** Blocking ends every session of the account at once (Better Auth's admin plugin does it). */
export const banUser = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(adminBanInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const target = await findNonAdminTarget({ userId: data.userId, adminId: context.admin.id });
        let banReason: string | undefined = undefined;

        if (data.reason.length > 0) {
            banReason = data.reason;
        }

        await auth.api.banUser({
            headers: context.headers,
            body: { userId: target.id, banReason },
        });
    });

export const unbanUser = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(adminUserIdInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const target = await findTargetUser({ userId: data.userId, adminId: context.admin.id });

        await auth.api.unbanUser({ headers: context.headers, body: { userId: target.id } });
    });

export const setUserAdminRole = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(adminRoleInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const target = await findTargetUser({ userId: data.userId, adminId: context.admin.id });
        const role = toRole(data.isAdmin);

        await auth.api.setRole({ headers: context.headers, body: { userId: target.id, role } });
    });

export const revokeUserSessions = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(adminUserIdInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const target = await findNonAdminTarget({ userId: data.userId, adminId: context.admin.id });

        await auth.api.revokeUserSessions({
            headers: context.headers,
            body: { userId: target.id },
        });
    });

export const deleteUser = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(adminUserIdInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const target = await findNonAdminTarget({ userId: data.userId, adminId: context.admin.id });

        await deleteUserAccount(target.id);
    });
