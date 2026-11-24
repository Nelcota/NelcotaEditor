import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    buildAssSubtitles,
    InvalidSubtitleTimeError,
} from "#/modules/clips/model/build-ass-subtitles";
import type { CaptionRenderOptions } from "#/modules/clips/model/build-ass-subtitles";
import type { CaptionCue, CaptionWord } from "#/modules/clips/model/clip-studio";

const CLASSIC: CaptionRenderOptions = {
    aspectRatio: "vertical",
    style: "classic",
    color: "yellow",
    size: "medium",
    position: "bottom",
    font: "montserrat",
};

const KARAOKE: CaptionRenderOptions = { ...CLASSIC, style: "karaoke" };

function word(text: string, startSeconds: number, endSeconds: number): CaptionWord {
    return { text, startSeconds, endSeconds };
}

function cueOf(words: Array<CaptionWord>): CaptionCue {
    const first = words[0];
    const last = words.at(-1);

    if (first === undefined || last === undefined) {
        throw new Error("A test cue needs at least one word");
    }

    return { startSeconds: first.startSeconds, endSeconds: last.endSeconds, words };
}

function dialogueLines(subtitles: string): Array<string> {
    return subtitles.split("\n").filter((line) => line.startsWith("Dialogue:"));
}

/** Start, end and text of a Dialogue line. */
function parseDialogue(line: string): { start: string; end: string; text: string } {
    const fields = line.slice("Dialogue: ".length).split(",");

    return { start: fields[1] ?? "", end: fields[2] ?? "", text: fields.slice(9).join(",") };
}

describe("buildAssSubtitles header", () => {
    it("uses the frame size, alignment and font of the options", () => {
        const subtitles = buildAssSubtitles([], CLASSIC);

        assert.match(subtitles, /^\[Script Info\]/);
        assert.match(subtitles, /PlayResX: 1080\nPlayResY: 1920/);
        assert.match(subtitles, /Style: Caption,Montserrat,96,/);
        assert.deepEqual(dialogueLines(subtitles), []);
    });

    it("puts top captions at alignment 8", () => {
        const subtitles = buildAssSubtitles([], { ...CLASSIC, position: "top" });

        assert.match(subtitles, /,8,90,90,560,1$/m);
    });
});

describe("buildAssSubtitles text", () => {
    it("removes braces, backslashes and line breaks from the transcript", () => {
        const cues = [cueOf([word("{\\b1}oi\\N", 0, 0.5), word("tu\r\ndo}", 0.5, 1)])];
        const lines = dialogueLines(buildAssSubtitles(cues, CLASSIC));

        assert.equal(lines.length, 2);

        for (const line of lines) {
            const text = parseDialogue(line).text;
            assert.equal(text, "B1OIN TU DO");
            assert.doesNotMatch(text, /[{}\\\r\n]/);
        }
    });

    it("highlights the spoken word in the chosen colour in karaoke style", () => {
        const cues = [cueOf([word("oi", 0, 0.5), word("tudo", 0.5, 1)])];
        const lines = dialogueLines(buildAssSubtitles(cues, KARAOKE));

        assert.equal(parseDialogue(lines[0] ?? "").text, "{\\c&H0000E5FF&}OI{\\r} TUDO");
        assert.equal(parseDialogue(lines[1] ?? "").text, "OI {\\c&H0000E5FF&}TUDO{\\r}");
    });
});

describe("buildAssSubtitles times", () => {
    it("rounds 59.996 s up to the next minute", () => {
        const cues = [cueOf([word("oi", 59.996, 60.5)])];
        const line = dialogueLines(buildAssSubtitles(cues, CLASSIC))[0] ?? "";

        assert.equal(parseDialogue(line).start, "0:01:00.00");
    });

    it("writes hours, minutes, seconds and hundredths", () => {
        const cues = [cueOf([word("oi", 3725.5, 3726)])];
        const line = dialogueLines(buildAssSubtitles(cues, CLASSIC))[0] ?? "";

        assert.equal(parseDialogue(line).start, "1:02:05.50");
    });

    it("throws for a NaN time", () => {
        const cues = [cueOf([word("oi", Number.NaN, 1)])];

        assert.throws(() => buildAssSubtitles(cues, CLASSIC), InvalidSubtitleTimeError);
    });

    it("holds a word until the next word starts", () => {
        const cues = [cueOf([word("oi", 0, 0.3), word("tudo", 0.8, 1)])];
        const line = dialogueLines(buildAssSubtitles(cues, CLASSIC))[0] ?? "";

        assert.equal(parseDialogue(line).end, "0:00:00.80");
    });

    it("lets the last word linger 0.3 s, but never past the next cue", () => {
        const cues = [cueOf([word("oi", 0, 1)]), cueOf([word("tudo", 1.1, 2)])];
        const lines = dialogueLines(buildAssSubtitles(cues, CLASSIC));

        assert.equal(parseDialogue(lines[0] ?? "").end, "0:00:01.10");
        assert.equal(parseDialogue(lines[1] ?? "").end, "0:00:02.30");
    });
});
