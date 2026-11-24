import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const storageDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-disk-storage-"));

process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
process.env.STORAGE_DIR = storageDirectory;
process.env.WHISPER_URL = "http://127.0.0.1:1";
process.env.WHISPER_MODEL = "test-model";

const { diskFileStorage } = await import("#/shared/server/file-storage/disk-file-storage.server");
const { StoragePathError } = await import("#/shared/server/storage.server");

class StreamBrokeError extends Error {
    constructor() {
        super("Stream broke");
        this.name = "StreamBrokeError";
    }
}

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

function streamOf(...chunks: Array<string>): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();

    return new ReadableStream({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(encoder.encode(chunk));
            }

            controller.close();
        },
    });
}

function brokenStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode("half a video"));
        },
        pull() {
            throw new StreamBrokeError();
        },
    });
}

describe("diskFileStorage", () => {
    it("stores a stream under its key and returns its size", async () => {
        const bytes = await diskFileStorage.storeStream(
            "videos/a/source.mp4",
            streamOf("ab", "cd"),
        );

        expect(bytes).toBe(4);
        expect(await readFile(path.join(storageDirectory, "videos/a/source.mp4"), "utf8")).toBe(
            "abcd",
        );
    });

    it("leaves nothing behind when the stream fails", async () => {
        const run = diskFileStorage.storeStream("videos/b/source.mp4", brokenStream());

        await expect(run).rejects.toThrow(StreamBrokeError);
        expect(await fileExists(path.join(storageDirectory, "videos/b/source.mp4"))).toBe(false);
        expect(await fileExists(path.join(storageDirectory, "videos/b/source.mp4.partial"))).toBe(
            false,
        );
    });

    it("copies a local file in and keeps the original", async () => {
        const localDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-local-"));
        const localFile = path.join(localDirectory, "clip.mp4");
        await writeFile(localFile, "a whole clip");

        const bytes = await diskFileStorage.storeLocalFile("videos/c/clips/clip.mp4", localFile);

        expect(bytes).toBe(12);
        expect(await fileExists(localFile)).toBe(true);
        await rm(localDirectory, { recursive: true, force: true });
    });

    it("measures a missing file as 0", async () => {
        expect(await diskFileStorage.measureFile("videos/missing/source.mp4")).toBe(0);
    });

    it("deletes a folder with every file in it", async () => {
        await mkdir(path.join(storageDirectory, "videos/d/clips"), { recursive: true });
        await writeFile(path.join(storageDirectory, "videos/d/clips/one.mp4"), "clip");

        await diskFileStorage.deleteFolder("videos/d");

        expect(await fileExists(path.join(storageDirectory, "videos/d"))).toBe(false);
    });

    it("refuses a key that leaves the storage folder", async () => {
        await expect(diskFileStorage.deleteFolder("../outside")).rejects.toThrow(StoragePathError);
    });

    it("answers 404 for a file that is gone", async () => {
        const request = new Request("http://localhost/api/clips/x/file");

        const response = await diskFileStorage.respondWithFile(
            request,
            "videos/gone/clip.mp4",
            new Headers(),
        );

        expect(response.status).toBe(404);
    });
});
