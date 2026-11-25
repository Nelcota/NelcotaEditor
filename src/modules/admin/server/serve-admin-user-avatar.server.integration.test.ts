import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { serveAdminUserAvatar } from "#/modules/admin/server/serve-admin-user-avatar.server";
import { ADMIN_ROLE, user } from "#/modules/auth/auth.schema";
import { toPhotoImage } from "#/modules/auth/model/avatar";
import { auth } from "#/modules/auth/server/auth.server";
import { saveUserImage, writeAvatarPhoto } from "#/modules/auth/server/avatar-storage.server";

// Runs against the test database from .env.test, with the disk store: bun run test:integration

const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

interface SignedInAccount {
    userId: string;
    headers: Headers;
}

/** "a=1; Path=/" from each Set-Cookie becomes "a=1" in one Cookie header. */
function toCookieHeaders(setCookieHeaders: Headers): Headers {
    const cookie = setCookieHeaders
        .getSetCookie()
        .map((setCookie) => setCookie.split(";")[0] ?? "")
        .join("; ");

    return new Headers({ cookie });
}

async function signIn(role: "admin" | "user"): Promise<SignedInAccount> {
    const id = randomUUID();
    const email = `avatar-${id}@example.com`;
    const password = `senha-${id}`;
    const signedUp = await auth.api.signUpEmail({ body: { name: "Conta Teste", email, password } });
    await db.update(user).set({ emailVerified: true }).where(eq(user.email, email));

    if (role === "admin") {
        await db.update(user).set({ role: ADMIN_ROLE }).where(eq(user.email, email));
    }

    const signedIn = await auth.api.signInEmail({ body: { email, password }, returnHeaders: true });

    return { userId: signedUp.user.id, headers: toCookieHeaders(signedIn.headers) };
}

async function createAccountWithPhoto(): Promise<string> {
    const owner = await signIn("user");
    await writeAvatarPhoto(owner.userId, "png", PNG_SIGNATURE);
    await saveUserImage(owner.userId, toPhotoImage("png", Date.now()));

    return owner.userId;
}

function requestAvatar(headers: Headers): Request {
    return new Request("http://localhost/api/admin/users/avatar", { headers });
}

afterAll(async () => {
    await db.$client.end();
});

describe("serveAdminUserAvatar", () => {
    it("serves another account's photo to an admin", async () => {
        const ownerId = await createAccountWithPhoto();
        const admin = await signIn("admin");

        const response = await serveAdminUserAvatar(requestAvatar(admin.headers), ownerId);

        expect(response.status).toBe(HTTP_OK);
        expect(response.headers.get("cache-control")).toBe("private, no-store");
        expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG_SIGNATURE);

        await db.update(user).set({ role: "user" }).where(eq(user.id, admin.userId));
        const afterRevocation = await serveAdminUserAvatar(requestAvatar(admin.headers), ownerId);

        expect(afterRevocation.status).toBe(HTTP_NOT_FOUND);
    });

    it("answers 404 to a signed-in person who is not an admin", async () => {
        const ownerId = await createAccountWithPhoto();
        const viewer = await signIn("user");

        const response = await serveAdminUserAvatar(requestAvatar(viewer.headers), ownerId);

        expect(response.status).toBe(HTTP_NOT_FOUND);
    });

    it("answers 401 without a session", async () => {
        const ownerId = await createAccountWithPhoto();

        const response = await serveAdminUserAvatar(requestAvatar(new Headers()), ownerId);

        expect(response.status).toBe(HTTP_UNAUTHORIZED);
    });

    it("answers 404 to an admin when the account has no photo", async () => {
        const admin = await signIn("admin");
        const owner = await signIn("user");

        const response = await serveAdminUserAvatar(requestAvatar(admin.headers), owner.userId);

        expect(response.status).toBe(HTTP_NOT_FOUND);
    });
});
