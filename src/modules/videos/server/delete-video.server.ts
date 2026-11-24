import { holdUploadOfDeletedVideo } from "#/modules/videos/server/pending-uploads.server";
import { deleteStoppedVideoRow } from "#/modules/video-records/server/stop-video.server";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getVideoDirectory } from "#/shared/server/storage.server";

/**
 * Deletes a stopped video and its files. Its upload link may still be valid, so the space stays
 * held and the folder is swept again once the link can no longer write. The hold goes in before
 * the files are deleted, so a store that fails here still leaves them to the sweep. The caller
 * checks who may delete it.
 */
export async function deleteVideoCoveringUploadLink(videoId: string): Promise<void> {
    const deletedVideo = await deleteStoppedVideoRow(videoId);
    await holdUploadOfDeletedVideo(deletedVideo);
    await getFileStorage().deleteFolder(getVideoDirectory(videoId));
}
