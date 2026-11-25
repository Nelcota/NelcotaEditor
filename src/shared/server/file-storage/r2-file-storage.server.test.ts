import type { ReadStream } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NoSuchKey, S3Client } from "@aws-sdk/client-s3";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    InvalidStorageKeyError,
    createR2FileStorage,
} from "#/shared/server/file-storage/r2-file-storage.server";

const openedStreams = vi.hoisted(() => {
    const streams: Array<ReadStream> = [];
    return streams;
});

vi.mock("node:fs", async (importOriginal) => {
    const original = await importOriginal<typeof import("node:fs")>();

    return {
        ...original,
        createReadStream: (...args: Parameters<typeof original.createReadStream>): ReadStream => {
            const stream = original.createReadStream(...args);
            openedStreams.push(stream);
            return stream;
        },
    };
});

afterEach(() => {
    openedStreams.splice(0);
});

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

    it("serves a proxied object directly with the supplied headers", async () => {
        const photo = new Uint8Array([1, 2, 3]);
        const send = vi.spyOn(S3Client.prototype, "send");
        send.mockImplementationOnce(() => ({
            Body: { transformToWebStream: () => new Blob([photo]).stream() },
        }));
        const headers = new Headers({
            "Content-Type": "image/png",
            "Cache-Control": "private, no-store",
        });

        try {
            const response = await storage.respondWithFile(request, {
                key: "avatars/user.png",
                headers,
                linkLifetimeSeconds: 600,
                shouldProxy: true,
            });

            expect(response.status).toBe(200);
            expect(response.headers.get("Location")).toBeNull();
            expect(response.headers.get("Content-Type")).toBe("image/png");
            expect(response.headers.get("Cache-Control")).toBe("private, no-store");
            expect(new Uint8Array(await response.arrayBuffer())).toEqual(photo);
        } finally {
            send.mockRestore();
        }
    });

    it("returns a 404 without issuing a signed URL when a proxied object is gone", async () => {
        const send = vi.spyOn(S3Client.prototype, "send");
        send.mockRejectedValueOnce(new NoSuchKey({ message: "Object not found", $metadata: {} }));
        const headers = new Headers({ "Cache-Control": "private, no-store" });

        try {
            const response = await storage.respondWithFile(request, {
                key: "avatars/user.png",
                headers,
                linkLifetimeSeconds: 600,
                shouldProxy: true,
            });

            expect(response.status).toBe(404);
            expect(response.headers.get("Location")).toBeNull();
            expect(response.headers.get("Cache-Control")).toBe("private, no-store");
        } finally {
            send.mockRestore();
        }
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

describe("createR2FileStorage measureFile", () => {
    it("distinguishes a missing length from a measured empty object", async () => {
        const key = "videos/abc/source.mp4";
        const send = vi.spyOn(S3Client.prototype, "send");
        send.mockImplementationOnce(() => ({})).mockImplementationOnce(() => ({
            ContentLength: 0,
        }));

        try {
            await expect(storage.measureFile(key)).rejects.toThrow("valid content length");
            await expect(storage.measureFile(key)).resolves.toBe(0);
        } finally {
            send.mockRestore();
        }
    });
});

describe("createR2FileStorage createUploadUrl", () => {
    it("signs a PUT that only creates a new object of the declared size", async () => {
        const uploadUrl = await storage.createUploadUrl("videos/abc/source.mp4", {
            sizeBytes: 1234,
            lifetimeSeconds: 3600,
        });

        const location = new URL(uploadUrl ?? "");
        expect(location.pathname).toBe("/nelcota-media/videos/abc/source.mp4");
        expect(location.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
        expect(location.searchParams.get("X-Amz-SignedHeaders")).toContain("if-none-match");
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

    it("closes the local file when the run was cancelled before the upload", async () => {
        const workDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-r2-"));
        const localFile = path.join(workDirectory, "thumbnail.jpg");
        await writeFile(localFile, "a frame");

        const run = storage.storeLocalFile("videos/abc/thumbnail.jpg", localFile, {
            signal: AbortSignal.abort(),
        });

        await expect(run).rejects.toMatchObject({ name: "AbortError" });
        expect(openedStreams.map((stream) => stream.destroyed)).toEqual([true]);
        await rm(workDirectory, { recursive: true, force: true });
    });
});
