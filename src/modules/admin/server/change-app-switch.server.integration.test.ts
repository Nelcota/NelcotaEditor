import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { adminAuditLog } from "#/modules/admin/admin.schema";
import { listAdminAppSwitches } from "#/modules/admin/server/admin-app-switch-rows.server";
import { changeAppSwitch } from "#/modules/admin/server/change-app-switch.server";
import { requireAdmin } from "#/modules/admin/server/require-admin.server";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import { isAppSwitchEnabled } from "#/modules/app-switches/server/app-switches.server";
import { ADMIN_ROLE, user } from "#/modules/auth/auth.schema";
import { auth } from "#/modules/auth/server/auth.server";

// Runs against the test database from .env.test: bun run test:integration

/** "a=1; Path=/" from each Set-Cookie becomes "a=1" in one Cookie header. */
function toCookieHeaders(setCookieHeaders: Headers): Headers {
    const cookie = setCookieHeaders
        .getSetCookie()
        .map((setCookie) => setCookie.split(";")[0] ?? "")
        .join("; ");

    return new Headers({ cookie });
}

/** A verified account signed in through Better Auth; returns the headers its browser would send. */
async function signIn(role: "admin" | "user"): Promise<Headers> {
    const id = randomUUID();
    const email = `switches-${id}@example.com`;
    const password = `senha-${id}`;
    await auth.api.signUpEmail({ body: { name: "Admin Teste", email, password } });
    await db.update(user).set({ emailVerified: true }).where(eq(user.email, email));

    if (role === "admin") {
        await db.update(user).set({ role: ADMIN_ROLE }).where(eq(user.email, email));
    }

    const signedIn = await auth.api.signInEmail({ body: { email, password }, returnHeaders: true });

    return toCookieHeaders(signedIn.headers);
}

async function createAdminId(): Promise<string> {
    const admin = await requireAdmin(await signIn("admin"));

    return admin.id;
}

afterAll(async () => {
    await db.delete(appSwitches);
    await db.$client.end();
});

describe("requireAdmin", () => {
    it("rejects a request without a session", async () => {
        await expect(requireAdmin(new Headers())).rejects.toThrow("Sua sessão expirou");
    });

    it("rejects a signed-in person who is not an admin", async () => {
        const headers = await signIn("user");

        await expect(requireAdmin(headers)).rejects.toThrow("Esta área é só para administradores.");
    });

    it("lets an admin through", async () => {
        const headers = await signIn("admin");

        const admin = await requireAdmin(headers);

        expect(admin.isAdmin).toBe(true);
    });
});

describe("changeAppSwitch", () => {
    beforeEach(async () => {
        await db.delete(appSwitches);
    });

    it("turns the feature off", async () => {
        const adminId = await createAdminId();

        await changeAppSwitch(adminId, { key: "file-uploads", isEnabled: false });

        expect(await isAppSwitchEnabled("file-uploads")).toBe(false);
    });

    it("records the change on the admin audit log", async () => {
        const adminId = await createAdminId();

        await changeAppSwitch(adminId, { key: "clip-sharing", isEnabled: false });

        const entries = await db
            .select({ details: adminAuditLog.details })
            .from(adminAuditLog)
            .where(
                and(eq(adminAuditLog.adminId, adminId), eq(adminAuditLog.action, "set-app-switch")),
            );
        expect(entries).toEqual([{ details: { switchKey: "clip-sharing", isEnabled: false } }]);
    });

    it("lists every switch with the admin who changed it last", async () => {
        const adminId = await createAdminId();
        await changeAppSwitch(adminId, { key: "sign-up", isEnabled: false });

        const switches = await listAdminAppSwitches();

        expect(switches).toHaveLength(6);
        expect(switches.find((appSwitch) => appSwitch.key === "sign-up")).toMatchObject({
            isEnabled: false,
            changedByName: "Admin Teste",
        });
        expect(switches.find((appSwitch) => appSwitch.key === "file-uploads")).toMatchObject({
            isEnabled: true,
            changedAt: null,
        });
    });
});
