import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { ADMIN_ROLE, user } from "#/modules/auth/auth.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

interface TargetUser {
    id: string;
    isAdmin: boolean;
}

interface TargetRequest {
    userId: string;
    adminId: string;
}

/**
 * The account an admin action is aimed at. Acting on yourself or on another admin is refused, so an
 * admin cannot lock themself out or take over a peer: remove the peer's admin role first.
 */
export async function findTargetUser(request: TargetRequest): Promise<TargetUser> {
    if (request.userId === request.adminId) {
        throw new UserFacingError("Esta ação não pode ser feita na sua própria conta.");
    }

    const rows = await db
        .select({ id: user.id, role: user.role })
        .from(user)
        .where(eq(user.id, request.userId))
        .limit(1);
    const target = rows[0];

    if (target === undefined) {
        throw new UserFacingError("Conta não encontrada. Ela pode ter sido excluída.");
    }

    return { id: target.id, isAdmin: target.role === ADMIN_ROLE };
}

export async function findNonAdminTarget(request: TargetRequest): Promise<TargetUser> {
    const target = await findTargetUser(request);

    if (target.isAdmin === true) {
        throw new UserFacingError("Remova o acesso de admin desta conta antes de fazer isso.");
    }

    return target;
}
