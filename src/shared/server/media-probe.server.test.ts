import path from "node:path";
import { describe, expect, it } from "vitest";
import { probeMedia } from "#/shared/server/media-probe.server";

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
});
