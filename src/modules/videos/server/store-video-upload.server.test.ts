import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const storageDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-upload-"));

process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
process.env.STORAGE_DIR = storageDirectory;
process.env.WHISPER_URL = "http://127.0.0.1:1";
process.env.WHISPER_MODEL = "test-model";

const { EmptyUploadError, UploadTooLargeError, storeVideoUpload } =
    await import("#/modules/videos/server/store-video-upload.server");

const VIDEO_ID = "0190a4b2-7c1e-7a00-8000-000000000001";

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
    it("stores the upload as the video's source and returns its key and size", async () => {
        const stored = await storeVideoUpload(streamOfBytes(10), {
            videoId: VIDEO_ID,
            extension: ".mp4",
            maxBytes: 10,
        });

        expect(stored).toEqual({ sourcePath: `videos/${VIDEO_ID}/source.mp4`, sourceBytes: 10 });
    });

    it("refuses a body larger than the reserved size and removes the video folder", async () => {
        const run = storeVideoUpload(streamOfBytes(11), {
            videoId: VIDEO_ID,
            extension: ".mp4",
            maxBytes: 10,
        });

        await expect(run).rejects.toThrow(UploadTooLargeError);
        expect(await fileExists(path.join(storageDirectory, "videos", VIDEO_ID))).toBe(false);
    });

    it("refuses an empty body", async () => {
        const run = storeVideoUpload(streamOfBytes(0), {
            videoId: VIDEO_ID,
            extension: ".mp4",
            maxBytes: 10,
        });

        await expect(run).rejects.toThrow(EmptyUploadError);
    });
});
