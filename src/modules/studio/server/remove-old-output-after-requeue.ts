import type { RenderDraftResult } from "#/modules/studio/model/clip-studio-view";

/**
 * Requeues the clip and only then removes its previous file. A failed or conflicting requeue
 * rolls back to the clip as it was, still pointing at that file, so the file must survive it.
 */
export async function requeueThenRemoveOldOutput(
    requeue: () => Promise<RenderDraftResult>,
    removeOldOutput: () => Promise<void>,
): Promise<RenderDraftResult> {
    const result = await requeue();

    if (result.kind !== "queued") {
        return result;
    }

    await removeOldOutput();
    return result;
}
