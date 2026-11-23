import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildYtDlpArguments } from "#/modules/processing/server/download-youtube-video.server";

const VIDEO_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
const OUTPUT_TEMPLATE = "/app/storage/videos/abc/source.%(ext)s";

describe("buildYtDlpArguments", () => {
    it("ignores every yt-dlp config file", () => {
        const ytDlpArguments = buildYtDlpArguments(VIDEO_URL, OUTPUT_TEMPLATE);

        assert.equal(ytDlpArguments[0], "--ignore-config");
    });

    it("passes the URL last, after the end of options", () => {
        const ytDlpArguments = buildYtDlpArguments(VIDEO_URL, OUTPUT_TEMPLATE);

        assert.deepEqual(ytDlpArguments.slice(-2), ["--", VIDEO_URL]);
    });
});
