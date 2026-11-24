import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { inspect } from "node:util";
import { CommandFailedError, runCommand } from "#/shared/server/run-command.server";

describe("CommandFailedError", () => {
    it("keeps the stderr tail but drops links and YouTube ids from the message", () => {
        const stderr = [
            "[youtube] Extracting URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "ERROR: [youtube] dQw4w9WgXcQ: Private video. Sign in if you've been granted access",
        ].join("\n");

        const error = new CommandFailedError("yt-dlp", 1, stderr);

        assert.equal(error.message.includes("dQw4w9WgXcQ"), false);
        assert.equal(error.message.includes("youtube.com"), false);
        assert.equal(error.message.includes("Private video"), true);
        assert.equal(error.message.startsWith("yt-dlp exited with code 1"), true);
    });

    it("prints no link when the failed command is logged whole", async () => {
        const link = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        const script = "console.error(process.argv[1]); process.exit(1)";

        await assert.rejects(runCommand(process.execPath, ["-e", script, link]), (error) => {
            assert.equal(error instanceof CommandFailedError, true);
            assert.equal(inspect(error).includes("dQw4w9WgXcQ"), false);
            return true;
        });
    });
});
