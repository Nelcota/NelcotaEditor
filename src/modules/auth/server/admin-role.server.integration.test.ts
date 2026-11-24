import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { ADMIN_ROLE, USER_ROLE, user } from "#/modules/auth/auth.schema";
import { LastAdminError } from "#/modules/auth/model/last-admin-error";
import { isLastAdmin, removeAdminRole } from "#/modules/auth/server/admin-role.server";

// Runs against the test database from .env.test: bun run test:integration

async function createAdmin(): Promise<string> {
    const userId = randomUUID();
    await db.insert(user).values({
        id: userId,
        name: "Test admin",
        email: `${userId}@example.com`,
        emailVerified: false,
        role: ADMIN_ROLE,
    });

    return userId;
}

async function countAdmins(): Promise<number> {
    const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, ADMIN_ROLE));

    return admins.length;
}

describe("removeAdminRole", () => {
    // The rule counts every admin in the database; the admins of other test files would hide it.
    beforeEach(async () => {
        await db.update(user).set({ role: USER_ROLE }).where(eq(user.role, ADMIN_ROLE));
    });

    afterAll(async () => {
        await db.$client.end();
    });

    it("removes the role while another admin remains", async () => {
        const removedAdminId = await createAdmin();
        await createAdmin();

        await removeAdminRole(removedAdminId);

        expect(await countAdmins()).toBe(1);
    });

    it("refuses to remove the last admin", async () => {
        const lastAdminId = await createAdmin();

        await expect(removeAdminRole(lastAdminId)).rejects.toThrow(LastAdminError);
        expect(await countAdmins()).toBe(1);
    });

    it("keeps one admin when two admins remove each other at the same time", async () => {
        const firstAdminId = await createAdmin();
        const secondAdminId = await createAdmin();

        const results = await Promise.allSettled([
            removeAdminRole(firstAdminId),
            removeAdminRole(secondAdminId),
        ]);

        expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
        expect(await countAdmins()).toBe(1);
    });

    it("tells the last admin apart from one of many", async () => {
        const firstAdminId = await createAdmin();

        expect(await isLastAdmin(firstAdminId)).toBe(true);
        await createAdmin();
        expect(await isLastAdmin(firstAdminId)).toBe(false);
    });
});
