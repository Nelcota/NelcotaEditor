import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { auth } from "#/modules/auth/server/auth.server";
import type { StartVideoUploadInput } from "#/modules/videos/model/video-upload-input";
import { discardPendingUpload } from "#/modules/videos/server/pending-uploads.server";
import { receiveUploadFile } from "#/modules/videos/server/receive-upload-file.server";
import { reserveVideoUpload } from "#/modules/videos/server/reserve-video-upload.server";
import { getEnvironment } from "#/shared/server/env.server";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getJobQueue } from "#/shared/server/job-queue.server";

// Runs against the test database from .env.test, with the disk store: bun run test:integration

const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;
const IP_OCTET_LIMIT = 255;
const UPLOAD_BYTES = 16;

const authUrl = getEnvironment().BETTER_AUTH_URL ?? "";
const trustedIpHeader = getEnvironment().TRUSTED_PROXY_IP_HEADER ?? "x-real-ip";

interface SignedInAccount {
    userId: string;
    cookie: string;
}

/** Each account has its own address, so the strict sign-up limit never trips across tests. */
function createClientAddress(): string {
    return `10.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}`;
}

async function postToAuth(path: string, body: object): Promise<Response> {
    const request = new Request(`${authUrl}/api/auth${path}`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: authUrl,
            [trustedIpHeader]: createClientAddress(),
        },
        body: JSON.stringify(body),
    });

    return auth.handler(request);
}

/** Signs up, confirms the email straight in the database, and signs in for a session cookie. */
async function signIn(): Promise<SignedInAccount> {
    const id = randomUUID();
    const account = {
        name: "Ana Teste",
        email: `upload-${id}@example.com`,
        password: `senha-${id}`,
    };
    await postToAuth("/sign-up/email", account);
    const confirmed = await db
        .update(user)
        .set({ emailVerified: true })
        .where(eq(user.email, account.email))
        .returning({ id: user.id });
    const confirmedUser = confirmed[0];

    if (confirmedUser === undefined) {
        throw new Error("The test account was not created");
    }

    const response = await postToAuth("/sign-in/email", {
        email: account.email,
        password: account.password,
    });
    const cookie = response.headers
        .getSetCookie()
        .map((setCookie) => setCookie.split(";")[0] ?? "")
        .join("; ");

    return { userId: confirmedUser.id, cookie };
}

function putFile(uploadId: string, cookie: string): Request {
    return new Request(`${authUrl}/api/videos/uploads/${uploadId}/file`, {
        method: "PUT",
        headers: { cookie },
        body: new Uint8Array(UPLOAD_BYTES),
    });
}

function uploadInput(): StartVideoUploadInput {
    return {
        fileName: "gravação.mp4",
        title: "",
        sizeBytes: UPLOAD_BYTES,
        clipCount: 3,
        clipLength: "minute",
        language: "pt",
    };
}

describe("receiveUploadFile with the disk store", () => {
    afterAll(async () => {
        const jobQueue = await getJobQueue();
        await jobQueue.stop({ graceful: false });
        await db.$client.end();
    });

    it("takes the file of an active upload", async () => {
        const account = await signIn();
        const upload = await reserveVideoUpload(account.userId, uploadInput());

        const response = await receiveUploadFile(putFile(upload.id, account.cookie), upload.id);

        expect(response.status).toBe(HTTP_NO_CONTENT);
        expect(await getFileStorage().measureFile(upload.sourcePath)).toBe(UPLOAD_BYTES);
    });

    it("answers 404 for a cancelled upload and stores nothing", async () => {
        const account = await signIn();
        const upload = await reserveVideoUpload(account.userId, uploadInput());
        await discardPendingUpload(upload.id);

        const response = await receiveUploadFile(putFile(upload.id, account.cookie), upload.id);

        expect(response.status).toBe(HTTP_NOT_FOUND);
        expect(await getFileStorage().measureFile(upload.sourcePath)).toBe(0);
    });
});
