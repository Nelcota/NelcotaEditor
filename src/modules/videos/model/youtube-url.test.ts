import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    describeYoutubeLinkProblem,
    toCanonicalYoutubeUrl,
    toYoutubeVideoId,
    youtubeUrlSchema,
} from "#/modules/videos/model/youtube-url";

const VIDEO_ID = "dQw4w9WgXcQ";

describe("toYoutubeVideoId", () => {
    it("reads the id from every supported link shape", () => {
        const links = [
            `https://www.youtube.com/watch?v=${VIDEO_ID}`,
            `https://youtube.com/watch?v=${VIDEO_ID}&t=42s`,
            `https://m.youtube.com/watch?v=${VIDEO_ID}`,
            `https://music.youtube.com/watch?v=${VIDEO_ID}&list=RD123`,
            `https://youtu.be/${VIDEO_ID}?si=tracking`,
            `https://www.youtube.com/shorts/${VIDEO_ID}`,
            `https://www.youtube.com/live/${VIDEO_ID}?feature=share`,
            `https://www.youtube.com/embed/${VIDEO_ID}`,
            `http://WWW.YOUTUBE.COM/watch?v=${VIDEO_ID}`,
        ];

        for (const link of links) {
            assert.equal(toYoutubeVideoId(link), VIDEO_ID, link);
        }
    });

    it("rejects hosts that only look like YouTube", () => {
        const links = [
            `https://youtube.com.evil.com/watch?v=${VIDEO_ID}`,
            `https://evilyoutube.com/watch?v=${VIDEO_ID}`,
            `https://youtube.com@evil.com/watch?v=${VIDEO_ID}`,
            `https://evil.com/youtube.com/watch?v=${VIDEO_ID}`,
            `https://evil.com/?u=https://youtu.be/${VIDEO_ID}`,
        ];

        for (const link of links) {
            assert.equal(toYoutubeVideoId(link), null, link);
        }
    });

    it("rejects other protocols, bad ids and links without a video", () => {
        const links = [
            `ftp://www.youtube.com/watch?v=${VIDEO_ID}`,
            `javascript://www.youtube.com/watch?v=${VIDEO_ID}`,
            "https://www.youtube.com/watch?v=short",
            `https://www.youtube.com/watch?v=${VIDEO_ID}x`,
            "https://www.youtube.com/playlist?list=PL123",
            "https://www.youtube.com/@channel",
            "https://youtu.be/",
            "not a link",
            "",
        ];

        for (const link of links) {
            assert.equal(toYoutubeVideoId(link), null, link);
        }
    });
});

describe("youtubeUrlSchema", () => {
    it("accepts YouTube hosts and trims the input", () => {
        const result = youtubeUrlSchema.safeParse(`  https://youtu.be/${VIDEO_ID}  `);

        assert.equal(result.success, true);
        assert.equal(result.data, `https://youtu.be/${VIDEO_ID}`);
    });

    it("rejects youtube.com.evil.com, empty and absurdly long input", () => {
        const tooLong = `https://www.youtube.com/watch?v=${VIDEO_ID}&x=${"a".repeat(2048)}`;

        assert.equal(youtubeUrlSchema.safeParse("https://youtube.com.evil.com/").success, false);
        assert.equal(youtubeUrlSchema.safeParse("   ").success, false);
        assert.equal(youtubeUrlSchema.safeParse(tooLong).success, false);
    });
});

describe("toCanonicalYoutubeUrl", () => {
    it("drops playlist, timestamp and tracking parameters", () => {
        const link = `https://youtu.be/${VIDEO_ID}?t=10&si=abc&list=PL1`;

        assert.equal(toCanonicalYoutubeUrl(link), `https://www.youtube.com/watch?v=${VIDEO_ID}`);
    });

    it("throws for a link that is not a video", () => {
        assert.throws(() => toCanonicalYoutubeUrl("https://youtube.com.evil.com/"));
    });
});

describe("describeYoutubeLinkProblem", () => {
    it("returns null for empty input and for a valid video link", () => {
        assert.equal(describeYoutubeLinkProblem("  "), null);
        assert.equal(describeYoutubeLinkProblem(`https://youtu.be/${VIDEO_ID}`), null);
    });

    it("explains a playlist link without a v parameter", () => {
        const problem = describeYoutubeLinkProblem("https://www.youtube.com/playlist?list=PL123");

        assert.match(problem ?? "", /playlist/);
    });

    it("explains a link from another host and a YouTube link without a video", () => {
        const otherHost = describeYoutubeLinkProblem("https://vimeo.com/123");
        const channel = describeYoutubeLinkProblem("https://www.youtube.com/@channel");

        assert.match(otherHost ?? "", /arquivo/);
        assert.match(channel ?? "", /não leva a um vídeo/);
    });
});
