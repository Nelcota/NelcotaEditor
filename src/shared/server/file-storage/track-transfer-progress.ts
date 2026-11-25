const PERCENT = 100;

/**
 * Passes the bytes through unchanged and reports how much of `totalBytes` has gone by (0 to 100).
 * A store that did not say the size (0) gives nothing to measure against, so nothing is reported.
 */
export function trackTransferProgress(
    totalBytes: number,
    onProgress: (percent: number) => void,
): TransformStream<Uint8Array, Uint8Array> {
    let transferredBytes = 0;

    return new TransformStream({
        transform(chunk, controller) {
            transferredBytes += chunk.byteLength;
            controller.enqueue(chunk);

            if (Number.isFinite(totalBytes) === true && totalBytes > 0) {
                onProgress((transferredBytes / totalBytes) * PERCENT);
            }
        },
    });
}
