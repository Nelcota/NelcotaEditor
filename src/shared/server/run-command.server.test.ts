import assert from "node:assert/strict";
import { execa } from "execa";
import { describe, it } from "vitest";
import { inspect } from "node:util";
import { CommandFailedError, runCommand } from "#/shared/server/run-command.server";

describe("runCommand", () => {
    it("returns after a command writes substantial stderr without a progress listener", async () => {
        // The symptom occurs in Bun, even though the same command can finish in Node.
        const script = `
            import { runCommand } from "#/shared/server/run-command.server";
            const writeFrames = ${JSON.stringify(`
                let batch = 0;
                const timer = setInterval(() => {
                    process.stderr.write("frame processed\\n".repeat(1024));
                    batch += 1;
                    if (batch === 250) {
                        clearInterval(timer);
                        console.log("completed");
                    }
                }, 2);
            `)};
            const output = await runCommand(process.execPath, ["-e", writeFrames], {
                signal: AbortSignal.timeout(3_000),
            });
            console.log(output);
        `;

        const result = await execa("bun", ["-e", script], { timeout: 4_000 });

        assert.equal(result.stdout, "completed");
    }, 8_000);

    it("forwards both stdout and stderr when a progress listener is present", async () => {
        const script = 'console.log("metadata"); console.error("progress")';
        const lines: Array<string> = [];

        const output = await runCommand(process.execPath, ["-e", script], {
            onOutputLine: (line): void => {
                lines.push(line);
            },
        });

        assert.equal(output, "metadata");
        assert.deepEqual(lines.toSorted(), ["metadata", "progress"]);
    });

    it("rejects with the cancellation reason while reading command output", async () => {
        const script = 'console.log("started"); setInterval(() => {}, 1_000)';
        const controller = new AbortController();
        const reason = new Error("Command cancelled");
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(3_000)]);

        const command = runCommand(process.execPath, ["-e", script], {
            signal,
            onOutputLine: (line): void => {
                if (line === "started") {
                    controller.abort(reason);
                }
            },
        });

        await assert.rejects(command, (error) => error === reason);
    });
});

describe("CommandFailedError", () => {
    it("keeps the stderr tail but drops links and YouTube ids from the message", () => {
        const stderr = [
            "[youtube] Extracting URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "ERROR: [youtube] dQw4w9WgXcQ: Private video. Sign in if you've been granted access",
        ].join("\n");

        const error = new CommandFailedError("yt-dlp", 1, stderr);

        assert.doesNotMatch(error.message, /dQw4w9WgXcQ/);
        assert.doesNotMatch(error.message, /youtube\.com/);
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
