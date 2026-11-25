import assert from "node:assert/strict";
import { describe, test } from "vitest";
import { createYoutubeDownloadProgressParser } from "#/modules/processing/server/youtube-download-progress.server";

describe("YouTube download progress", () => {
    test("reports both tracks and ignores progress that goes backwards", () => {
        const reported: Array<number> = [];
        const parse = createYoutubeDownloadProgressParser((percent) => reported.push(percent));

        parse('NELCOTA_FORMATS ["video","audio"]');
        parse('NELCOTA_PROGRESS ["video",100]');
        parse('NELCOTA_PROGRESS ["audio",40]');
        parse('NELCOTA_PROGRESS ["audio",25]');
        parse('NELCOTA_PROGRESS ["audio",100]');

        assert.deepEqual(reported, [50, 70, 100]);
    });

    test("reports the full range for a single muxed format", () => {
        const reported: Array<number> = [];
        const parse = createYoutubeDownloadProgressParser((percent) => reported.push(percent));

        parse('NELCOTA_FORMATS "muxed"');
        parse('NELCOTA_PROGRESS ["muxed",25]');
        parse('NELCOTA_PROGRESS ["muxed",100]');

        assert.deepEqual(reported, [25, 100]);
    });
});
