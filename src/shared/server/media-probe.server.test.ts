import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { MediaProbeError, probeMedia } from "#/shared/server/media-probe.server";
import * as mediaCommand from "#/shared/server/run-command.server";

class RunCancelledError extends Error {
    constructor() {
        super("Run cancelled");
        this.name = "RunCancelledError";
    }
}

describe("probeMedia", () => {
    it("stops reading the file when the run is cancelled", async () => {
        const cancellation = new AbortController();
        cancellation.abort(new RunCancelledError());

        const run = probeMedia(path.resolve("missing-source.mp4"), cancellation.signal);

        await expect(run).rejects.toThrow(RunCancelledError);
    });

    it("rejects an explicit null duration from ffprobe", async () => {
        const command = vi
            .spyOn(mediaCommand, "runCommand")
            .mockResolvedValueOnce(
                JSON.stringify({ format: { duration: null }, streams: [{ codec_type: "video" }] }),
            );
        const cancellation = new AbortController();

        try {
            await expect(
                probeMedia(path.resolve("video.mp4"), cancellation.signal),
            ).rejects.toThrow(MediaProbeError);
            expect(command).toHaveBeenCalledOnce();
        } finally {
            command.mockRestore();
        }
    });
});
