import assert from "node:assert/strict";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { removeFileOnFailure } from "#/modules/clips/server/remove-file-on-failure.server";

class RenderFailedError extends Error {
    constructor() {
        super("Render failed");
        this.name = "RenderFailedError";
    }
}

const directory = await mkdtemp(path.join(tmpdir(), "remove-file-on-failure-"));

after(async () => {
    await rm(directory, { recursive: true, force: true });
});

async function fileExists(absolutePath: string): Promise<boolean> {
    try {
        await access(absolutePath);
        return true;
    } catch {
        return false;
    }
}

describe("removeFileOnFailure", () => {
    it("removes the partial file and rethrows when the work fails", async () => {
        const partialFile = path.join(directory, "failed.mp4");

        const run = removeFileOnFailure(partialFile, async () => {
            await writeFile(partialFile, "half a video");
            throw new RenderFailedError();
        });

        await assert.rejects(run, RenderFailedError);
        assert.equal(await fileExists(partialFile), false);
    });

    it("keeps the file and returns the result when the work succeeds", async () => {
        const finishedFile = path.join(directory, "finished.mp4");

        const result = await removeFileOnFailure(finishedFile, async () => {
            await writeFile(finishedFile, "a whole video");
            return "rendered";
        });

        assert.equal(result, "rendered");
        assert.equal(await fileExists(finishedFile), true);
    });

    it("rethrows the work's error when no file was written", async () => {
        const missingFile = path.join(directory, "never-written.mp4");

        const run = removeFileOnFailure(missingFile, async () => {
            throw new RenderFailedError();
        });

        await assert.rejects(run, RenderFailedError);
    });

    it("rejects an empty path", async () => {
        await assert.rejects(
            removeFileOnFailure(" ", async () => "unused"),
            RangeError,
        );
    });
});
