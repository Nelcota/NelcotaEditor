import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { ADMIN_ROLE, user } from "#/modules/auth/auth.schema";
import { LastAdminError } from "#/modules/auth/model/last-admin-error";
import { deleteAvatarPhotos } from "#/modules/auth/server/avatar-storage.server";
import { isVideoWorking } from "#/modules/video-records/model/video-status";
import { holdUploadOfDeletedVideo } from "#/modules/videos/server/pending-uploads.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getVideoDirectory } from "#/shared/server/storage.server";

export class AccountHasWorkingVideosError extends Error {
    constructor(userId: string) {
        super(`Account ${userId} still has videos being processed`);
        this.name = "AccountHasWorkingVideosError";
    }
}

/**
 * Deletes the account row (its videos, clips and sessions go with it, through the foreign keys)
 * and returns the ids of the videos that went, so their files can be removed after the commit.
 *
 * Locking the user row makes a video insert of this account wait (its foreign key check needs
 * that row) and then fail, and makes this wait for an insert already in progress; locking the
 * video rows waits for a resume already in progress. So the returned ids are every video the
 * delete removed, and none of them is still being processed.
 *
 * The admin rows are locked before anything else, in the same order the role removal locks them,
 * so two last admins leaving at once run one after the other and the second one is refused.
 *
 * The upload link of a recent upload may still write its file after the account is gone, so each
 * such video leaves a cancelled reservation behind (its owner set to null by the delete), and the
 * sweep of expired uploads deletes whatever arrives.
 *
 * @returns The deleted video ids, or null when the account does not exist.
 * @throws {AccountHasWorkingVideosError} When a video is being processed; nothing is deleted.
 * @throws {LastAdminError} When the account is the only admin left; nothing is deleted.
 */
export async function deleteUserAccountRecords(userId: string): Promise<Array<string> | null> {
    return db.transaction(async (transaction) => {
        const admins = await transaction
            .select({ id: user.id })
            .from(user)
            .where(eq(user.role, ADMIN_ROLE))
            .for("update");

        if (admins.length <= 1 && admins.some((admin) => admin.id === userId) === true) {
            throw new LastAdminError();
        }

        const lockedUsers = await transaction
            .select({ id: user.id })
            .from(user)
            .where(eq(user.id, userId))
            .for("update");

        if (lockedUsers.length === 0) {
            return null;
        }

        const userVideos = await transaction
            .select({
                id: videos.id,
                userId: videos.userId,
                title: videos.title,
                status: videos.status,
                source: videos.source,
                sourcePath: videos.sourcePath,
                sourceBytes: videos.sourceBytes,
                requestedClipCount: videos.requestedClipCount,
                clipLength: videos.clipLength,
                transcriptionLanguage: videos.transcriptionLanguage,
                createdAt: videos.createdAt,
            })
            .from(videos)
            .where(eq(videos.userId, userId))
            .for("update");

        if (userVideos.some((video) => isVideoWorking(video.status)) === true) {
            throw new AccountHasWorkingVideosError(userId);
        }

        // One at a time on the same transaction; only uploads of the last few hours insert a row.
        for (const video of userVideos) {
            await holdUploadOfDeletedVideo(video, transaction);
        }

        await transaction.delete(user).where(eq(user.id, userId));
        return userVideos.map((video) => video.id);
    });
}

/** Removes the files of videos whose rows are already gone. */
async function deleteVideoFiles(videoIds: Array<string>): Promise<void> {
    const storage = getFileStorage();

    // One at a time: an account can hold many videos, and a remote store limits its requests.
    for (const videoId of videoIds) {
        await storage.deleteFolder(getVideoDirectory(videoId));
    }
}

/**
 * The one way an account is deleted, by its owner or by an admin: the rows first, in one
 * transaction, then the video files and the profile photo once the delete is committed.
 *
 * @returns False when the account does not exist.
 * @throws {AccountHasWorkingVideosError} When a video is being processed; nothing is deleted.
 * @throws {LastAdminError} When the account is the only admin left; nothing is deleted.
 */
export async function deleteAccountWithFiles(userId: string): Promise<boolean> {
    const videoIds = await deleteUserAccountRecords(userId);

    if (videoIds === null) {
        return false;
    }

    await deleteVideoFiles(videoIds);
    await deleteAvatarPhotos(userId);
    return true;
}
