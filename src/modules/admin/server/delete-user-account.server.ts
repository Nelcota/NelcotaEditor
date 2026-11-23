import {
    AccountHasWorkingVideosError,
    deleteAccountWithFiles,
} from "#/modules/video-records/server/delete-user-videos.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

/** The same deletion as a person deleting their own account, with the admin screen's messages. */
export async function deleteUserAccount(userId: string): Promise<void> {
    let wasDeleted: boolean;

    try {
        wasDeleted = await deleteAccountWithFiles(userId);
    } catch (error) {
        if (error instanceof AccountHasWorkingVideosError) {
            throw new UserFacingError(
                "Esta conta tem vídeos em processamento. Cancele-os antes de excluir a conta.",
            );
        }

        throw error;
    }

    if (wasDeleted === false) {
        throw new UserFacingError("Conta não encontrada. Ela pode já ter sido excluída.");
    }
}
