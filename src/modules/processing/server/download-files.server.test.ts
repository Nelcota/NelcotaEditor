import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, test } from "vitest";
import { removeDownloadFiles } from "#/modules/processing/server/download-files.server";

describe("removeDownloadFiles", () => {
    let videoDirectory = "";

    beforeEach(async () => {
        videoDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-download-"));
    });

    afterEach(async () => {
        await rm(videoDirectory, { recursive: true, force: true });
    });

    test("deletes the partial and unmerged files of a stopped download", async () => {
        await writeFile(path.join(videoDirectory, "source.f137.mp4.part"), "video");
        await writeFile(path.join(videoDirectory, "source.f140.m4a"), "audio");
        await writeFile(path.join(videoDirectory, "source.mp4"), "merged");

        await removeDownloadFiles(videoDirectory);

        assert.deepEqual(await readdir(videoDirectory), []);
    });

    test("keeps the files that are not part of the download", async () => {
        await writeFile(path.join(videoDirectory, "source.mp4.part"), "video");
        await writeFile(path.join(videoDirectory, "thumbnail.jpg"), "image");
        await mkdir(path.join(videoDirectory, "clips"));

        await removeDownloadFiles(videoDirectory);

        assert.deepEqual((await readdir(videoDirectory)).toSorted(), ["clips", "thumbnail.jpg"]);
    });

    test("does nothing when the folder does not exist", async () => {
        const missingDirectory = path.join(videoDirectory, "missing");

        await assert.doesNotReject(removeDownloadFiles(missingDirectory));
    });
});
