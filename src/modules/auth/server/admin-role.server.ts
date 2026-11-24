import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { ADMIN_ROLE, USER_ROLE, user } from "#/modules/auth/auth.schema";
import { LastAdminError } from "#/modules/auth/model/last-admin-error";

/**
 * Takes the admin role away, unless the account is the last admin.
 *
 * Every admin row is locked first, so two admins removing each other at the same time run one
 * after the other: the second one counts again after the first commits and is refused.
 *
 * @throws {LastAdminError} When the account is the only admin left; nothing changes.
 */
export async function removeAdminRole(userId: string): Promise<void> {
    if (userId.trim().length === 0) {
        throw new RangeError("Cannot remove the admin role without a user id");
    }

    await db.transaction(async (transaction) => {
        const admins = await transaction
            .select({ id: user.id })
            .from(user)
            .where(eq(user.role, ADMIN_ROLE))
            .for("update");

        if (admins.some((admin) => admin.id === userId) === false) {
            return;
        }

        if (admins.length <= 1) {
            throw new LastAdminError();
        }

        await transaction.update(user).set({ role: USER_ROLE }).where(eq(user.id, userId));
    });
}
