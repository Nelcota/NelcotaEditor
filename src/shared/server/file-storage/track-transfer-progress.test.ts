import { describe, expect, it } from "vitest";
import { trackTransferProgress } from "#/shared/server/file-storage/track-transfer-progress";

function streamOf(...sizes: Array<number>): ReadableStream<Uint8Array> {
    return new ReadableStream({
        start(controller) {
            for (const size of sizes) {
                controller.enqueue(new Uint8Array(size));
            }

            controller.close();
        },
    });
}

async function drain(stream: ReadableStream<Uint8Array>): Promise<number> {
    let receivedBytes = 0;

    for await (const chunk of stream) {
        receivedBytes += chunk.byteLength;
    }

    return receivedBytes;
}

describe("trackTransferProgress", () => {
    it("reports the share of the file received after each chunk", async () => {
        const reported: Array<number> = [];

        await drain(
            streamOf(25, 25, 50).pipeThrough(
                trackTransferProgress(100, reported.push.bind(reported)),
            ),
        );

        expect(reported).toEqual([25, 50, 100]);
    });

    it("passes every byte through", async () => {
        const receivedBytes = await drain(
            streamOf(10, 20).pipeThrough(trackTransferProgress(30, () => undefined)),
        );

        expect(receivedBytes).toBe(30);
    });

    it("reports nothing when the size is unknown", async () => {
        const reported: Array<number> = [];

        await drain(
            streamOf(10).pipeThrough(trackTransferProgress(0, reported.push.bind(reported))),
        );

        expect(reported).toEqual([]);
    });
});
