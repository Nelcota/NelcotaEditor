import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localFileInput } from "#/shared/server/local-media-input.server";

const SOURCE_PATH = "/app/storage/videos/0b6e4d0a-2f7c-4a4e-9a51-3f4d1c2b7e10/source.mp4";

function optionValue(inputArguments: Array<string>, optionName: string): string | undefined {
    const optionIndex = inputArguments.indexOf(optionName);

    if (optionIndex === -1) {
        return undefined;
    }

    return inputArguments[optionIndex + 1];
}

describe("localFileInput", () => {
    it("ends with the input, so its options apply to it", () => {
        const inputArguments = localFileInput(SOURCE_PATH);

        assert.deepEqual(inputArguments.slice(-2), ["-i", SOURCE_PATH]);
    });

    it("lets ffmpeg read only local files", () => {
        const inputArguments = localFileInput(SOURCE_PATH);

        assert.equal(optionValue(inputArguments, "-protocol_whitelist"), "file");
    });

    it("lets ffmpeg open only video containers, never a DASH or HLS manifest", () => {
        const inputArguments = localFileInput(SOURCE_PATH);

        const allowedFormats = optionValue(inputArguments, "-format_whitelist");

        assert.deepEqual(allowedFormats?.split(","), ["mov", "matroska", "avi"]);
    });
});
