import { holdUploadOfDeletedVideo } from "#/modules/videos/server/pending-uploads.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";
import { deleteStoppedVideoRow } from "#/modules/video-records/server/stop-video.server";
import type { Video } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getVideoDirectory } from "#/shared/server/storage.server";

/**
 * Deletes a stopped video and its files. Its upload link may still be valid, so the space stays
 * held and the folder is swept again once the link can no longer write. The row and the hold
 * change together under the owner's start lock, so no upload starts in space that is only free
 * for a moment; the files go after the commit, and a store that fails then leaves them to the
 * sweep. The caller checks who may delete it.
 */
export async function deleteVideoCoveringUploadLink(
    video: Pick<Video, "id" | "userId">,
): Promise<void> {
    await runVideoStartTransaction(video.userId, async ({ transaction }) => {
        const deletedVideo = await deleteStoppedVideoRow(video, transaction);
        await holdUploadOfDeletedVideo(deletedVideo, transaction);
    });
    await getFileStorage().deleteFolder(getVideoDirectory(video.id));
}
