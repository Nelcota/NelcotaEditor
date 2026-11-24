import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
    InvalidStorageKeyError,
    createR2FileStorage,
} from "#/shared/server/file-storage/r2-file-storage.server";

const ACCOUNT_ID = "0123456789abcdef0123456789abcdef";

const storage = createR2FileStorage({
    accountId: ACCOUNT_ID,
    accessKeyId: "test-access-key",
    secretAccessKey: "test-secret-key",
    bucket: "nelcota-media",
    spoolDirectory: "/tmp/unused",
});

const request = new Request("http://localhost/api/clips/x/file");

async function redirectFor(headers: Headers): Promise<{ response: Response; location: URL }> {
    const response = await storage.respondWithFile(request, {
        key: "videos/abc/clips/clip.mp4",
        headers,
        linkLifetimeSeconds: 600,
    });

    return { response, location: new URL(response.headers.get("Location") ?? "") };
}

describe("createR2FileStorage respondWithFile", () => {
    it("redirects to a signed link on the account endpoint, bucket in the path", async () => {
        const { response, location } = await redirectFor(new Headers());

        expect(response.status).toBe(302);
        expect(location.origin).toBe(`https://${ACCOUNT_ID}.r2.cloudflarestorage.com`);
        expect(location.pathname).toBe("/nelcota-media/videos/abc/clips/clip.mp4");
    });

    it("signs the link for the lifetime it was asked for", async () => {
        const { location } = await redirectFor(new Headers());

        expect(location.searchParams.get("X-Amz-Expires")).toBe("600");
    });

    it("asks the store to answer with the route's content type and disposition", async () => {
        const headers = new Headers({
            "Content-Type": "video/mp4",
            "Content-Disposition": 'attachment; filename="corte.mp4"',
        });

        const { location } = await redirectFor(headers);

        expect(location.searchParams.get("response-content-type")).toBe("video/mp4");
        expect(location.searchParams.get("response-content-disposition")).toBe(
            'attachment; filename="corte.mp4"',
        );
    });

    it("keeps the redirect out of every cache", async () => {
        const { response } = await redirectFor(new Headers());

        expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    });

    it("refuses a key that climbs out of its folder", async () => {
        const run = storage.respondWithFile(request, {
            key: "videos/../avatars/someone.png",
            headers: new Headers(),
            linkLifetimeSeconds: 600,
        });

        await expect(run).rejects.toThrow(InvalidStorageKeyError);
    });

    it("refuses an empty folder prefix instead of deleting the whole bucket", async () => {
        await expect(storage.deleteFolder("")).rejects.toThrow(InvalidStorageKeyError);
    });
});

describe("createR2FileStorage createUploadUrl", () => {
    it("signs a PUT that only takes a body of the declared size", async () => {
        const uploadUrl = await storage.createUploadUrl("videos/abc/source.mp4", {
            sizeBytes: 1234,
            lifetimeSeconds: 3600,
        });

        const location = new URL(uploadUrl ?? "");
        expect(location.pathname).toBe("/nelcota-media/videos/abc/source.mp4");
        expect(location.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
        expect(location.searchParams.get("X-Amz-Expires")).toBe("3600");
    });
});

describe("createR2FileStorage cancellation", () => {
    it("stops fetching a stored file when the run is cancelled", async () => {
        const workDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-r2-"));

        const run = storage.getLocalFile("videos/abc/source.mp4", workDirectory, {
            signal: AbortSignal.abort(),
        });

        await expect(run).rejects.toMatchObject({ name: "AbortError" });
        await rm(workDirectory, { recursive: true, force: true });
    });

    it("stops storing a local file when the run is cancelled", async () => {
        const workDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-r2-"));
        const localFile = path.join(workDirectory, "thumbnail.jpg");
        await writeFile(localFile, "a frame");

        const run = storage.storeLocalFile("videos/abc/thumbnail.jpg", localFile, {
            signal: AbortSignal.abort(),
        });

        await expect(run).rejects.toMatchObject({ name: "AbortError" });
        await rm(workDirectory, { recursive: true, force: true });
    });
});
