import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const storageDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-upload-"));

process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
process.env.STORAGE_DIR = storageDirectory;
process.env.WHISPER_URL = "http://127.0.0.1:1";
process.env.WHISPER_MODEL = "test-model";

const { EmptyUploadError, UploadLargerThanDeclaredError, storeVideoUpload } =
    await import("#/modules/videos/server/store-video-upload.server");

const SOURCE_PATH = "videos/0190a4b2-7c1e-7a00-8000-000000000001/source.mp4";

afterAll(async () => {
    await rm(storageDirectory, { recursive: true, force: true });
});

async function fileExists(absolutePath: string): Promise<boolean> {
    try {
        await access(absolutePath);
        return true;
    } catch {
        return false;
    }
}

function streamOfBytes(byteCount: number): ReadableStream<Uint8Array> {
    return new ReadableStream({
        start(controller) {
            if (byteCount > 0) {
                controller.enqueue(new Uint8Array(byteCount));
            }

            controller.close();
        },
    });
}

describe("storeVideoUpload", () => {
    it("stores the body under the reserved key and returns its size", async () => {
        const sourceBytes = await storeVideoUpload(streamOfBytes(10), {
            sourcePath: SOURCE_PATH,
            maxBytes: 10,
        });

        expect(sourceBytes).toBe(10);
    });

    it("refuses a body larger than declared and keeps nothing of it", async () => {
        const run = storeVideoUpload(streamOfBytes(11), {
            sourcePath: "videos/other/source.mp4",
            maxBytes: 10,
        });

        await expect(run).rejects.toThrow(UploadLargerThanDeclaredError);
        expect(await fileExists(path.join(storageDirectory, "videos/other/source.mp4"))).toBe(
            false,
        );
    });

    it("refuses an empty body and keeps nothing of it", async () => {
        const run = storeVideoUpload(streamOfBytes(0), {
            sourcePath: "videos/empty/source.mp4",
            maxBytes: 10,
        });

        await expect(run).rejects.toThrow(EmptyUploadError);
        expect(await fileExists(path.join(storageDirectory, "videos/empty/source.mp4"))).toBe(
            false,
        );
    });
});
