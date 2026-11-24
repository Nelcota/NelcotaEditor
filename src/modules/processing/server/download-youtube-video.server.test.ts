import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { buildYtDlpArguments } from "#/modules/processing/server/download-youtube-video.server";

const VIDEO_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
const OUTPUT_TEMPLATE = "/app/storage/videos/abc/source.%(ext)s";
const COOKIES_PATH = "/app/work/abc/youtube-cookies.txt";

describe("buildYtDlpArguments", () => {
    it("ignores every yt-dlp config file", () => {
        const ytDlpArguments = buildYtDlpArguments(VIDEO_URL, OUTPUT_TEMPLATE, null);

        assert.equal(ytDlpArguments[0], "--ignore-config");
    });

    it("passes the URL last, after the end of options", () => {
        const ytDlpArguments = buildYtDlpArguments(VIDEO_URL, OUTPUT_TEMPLATE, null);

        assert.deepEqual(ytDlpArguments.slice(-2), ["--", VIDEO_URL]);
    });

    it("passes the cookies file when one is configured", () => {
        const ytDlpArguments = buildYtDlpArguments(VIDEO_URL, OUTPUT_TEMPLATE, COOKIES_PATH);
        const cookiesIndex = ytDlpArguments.indexOf("--cookies");

        assert.equal(ytDlpArguments[cookiesIndex + 1], COOKIES_PATH);
    });

    it("sends no cookies when none are configured", () => {
        const ytDlpArguments = buildYtDlpArguments(VIDEO_URL, OUTPUT_TEMPLATE, null);

        assert.equal(ytDlpArguments.includes("--cookies"), false);
    });
});
