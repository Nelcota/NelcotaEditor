import { z } from "zod";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import fileSystem from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, afterEach, before, describe, it, mock } from "node:test";
import { createFileStream } from "#/shared/server/file-stream.server";

const logEntrySchema = z.object({ message: z.string(), file: z.string() });

const FILE_CONTENT = "hello, stream";

interface OpenedFiles {
    handles: Array<FileHandle>;
    closeCount: () => number;
}

/** Spies on every file the stream opens, counting how many get closed. */
function spyOnOpenedFiles(): OpenedFiles {
    const realOpen = fileSystem.open;
    const handles: Array<FileHandle> = [];
    let closedFiles = 0;

    mock.method(fileSystem, "open", async (...openArguments: Parameters<typeof realOpen>) => {
        const handle = await realOpen(...openArguments);
        const realClose = handle.close.bind(handle);
        handle.close = async (): Promise<void> => {
            closedFiles += 1;
            await realClose();
        };
        handles.push(handle);
        return handle;
    });

    return { handles, closeCount: () => closedFiles };
}

const MAX_EVENT_LOOP_TURNS = 1000;

interface Signal {
    promise: Promise<void>;
    fire: () => void;
}

/** A promise the test resolves by hand, to hold a read until the cancel has been sent. */
function createSignal(): Signal {
    let resolvePromise: (() => void) | undefined;
    const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
    });

    return { promise, fire: () => resolvePromise?.() };
}

async function nextEventLoopTurn(): Promise<void> {
    await new Promise((resolve) => setImmediate(resolve));
}

/** Waits until the stream opened its file, then one more turn so its start() can finish. */
async function waitForOpen(openedFiles: OpenedFiles): Promise<void> {
    for (let turn = 0; turn < MAX_EVENT_LOOP_TURNS; turn += 1) {
        if (openedFiles.handles.length > 0) {
            await nextEventLoopTurn();
            return;
        }

        await nextEventLoopTurn();
    }

    throw new Error("The stream never opened its file");
}

describe("createFileStream", () => {
    let directory = "";
    let filePath = "";

    before(async () => {
        directory = await mkdtemp(path.join(tmpdir(), "file-stream-test-"));
        filePath = path.join(directory, "source.mp4");
        await writeFile(filePath, FILE_CONTENT);
    });

    after(async () => {
        await rm(directory, { recursive: true, force: true });
    });

    afterEach(() => {
        mock.restoreAll();
    });

    it("streams the requested range and closes the file at the end", async () => {
        const openedFiles = spyOnOpenedFiles();

        const text = await new Response(createFileStream(filePath, 0, 4)).text();

        assert.equal(text, "hello");
        assert.equal(openedFiles.closeCount(), 1);
    });

    it("closes the file when the stream is cancelled while the file is still opening", async () => {
        const openedFiles = spyOnOpenedFiles();
        const stream = createFileStream(filePath, 0, FILE_CONTENT.length - 1);

        await stream.cancel();
        await waitForOpen(openedFiles);

        assert.equal(openedFiles.handles.length, 1);
        assert.equal(openedFiles.closeCount(), 1);
    });

    it("closes the file when the stream is cancelled after it opened", async () => {
        const openedFiles = spyOnOpenedFiles();
        const stream = createFileStream(filePath, 0, FILE_CONTENT.length - 1);
        await waitForOpen(openedFiles);

        await stream.cancel();

        assert.equal(openedFiles.closeCount(), 1);
    });

    it("closes the file once when the stream is cancelled while a read is in flight", async () => {
        const openedFiles = spyOnOpenedFiles();
        const stream = createFileStream(filePath, 0, FILE_CONTENT.length - 1);
        await waitForOpen(openedFiles);
        const handle = openedFiles.handles[0];

        if (handle === undefined) {
            throw new Error("The stream never opened its file");
        }

        const realRead = handle.read.bind(handle);
        const readStarted = createSignal();
        const releaseRead = createSignal();
        const markReadStarted = readStarted.fire;
        const letReadFinish = releaseRead.fire;
        mock.method(handle, "read", async (...readArguments: Parameters<FileHandle["read"]>) => {
            markReadStarted();
            await releaseRead.promise;
            return await realRead(...readArguments);
        });
        const reader = stream.getReader();
        const pendingChunk = reader.read();
        await readStarted.promise;

        const cancelled = reader.cancel();
        letReadFinish();
        await cancelled;
        await pendingChunk;
        await nextEventLoopTurn();

        assert.equal(openedFiles.closeCount(), 1);
    });

    it("logs a read that fails mid-way without the server's directories, then closes the file", async () => {
        const openedFiles = spyOnOpenedFiles();
        const logLines: Array<string> = [];
        mock.method(process.stderr, "write", (chunk: unknown) => {
            logLines.push(String(chunk));
            return true;
        });
        const stream = createFileStream(filePath, 0, FILE_CONTENT.length - 1);
        await waitForOpen(openedFiles);
        const handle = openedFiles.handles[0];

        if (handle === undefined) {
            throw new Error("The stream never opened its file");
        }

        mock.method(handle, "read", async (): Promise<never> => {
            throw new Error("disk read failed");
        });

        await assert.rejects(new Response(stream).text(), /disk read failed/);

        const expectedFile = `${path.basename(directory)}/source.mp4`;
        const entries = logLines.map((line) => logEntrySchema.parse(JSON.parse(line)));
        assert.deepEqual(entries, [{ message: "File stream failed mid-way", file: expectedFile }]);
        assert.equal(openedFiles.closeCount(), 1);
    });
});
