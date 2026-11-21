import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { deleteAvatarPhotos } from "#/modules/auth/server/avatar-storage.server";
import {
    deleteVideoFiles,
    hasWorkingVideos,
    listUserVideoIds,
} from "#/modules/video-records/server/delete-user-videos.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

/**
 * Same order as a person deleting their own account: the worker may be writing files of a video in
 * progress, so those must be cancelled first; the ids are read before the rows go (with the user,
 * through the foreign keys), and the files are removed only once the delete succeeded.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
    if ((await hasWorkingVideos(userId)) === true) {
        throw new UserFacingError(
            "Esta conta tem vídeos em processamento. Cancele-os antes de excluir a conta.",
        );
    }

    const videoIds = await listUserVideoIds(userId);
    const deletedRows = await db.delete(user).where(eq(user.id, userId)).returning({ id: user.id });

    if (deletedRows.length === 0) {
        throw new UserFacingError("Conta não encontrada. Ela pode já ter sido excluída.");
    }

    await deleteVideoFiles(videoIds);
    await deleteAvatarPhotos(userId);
}
