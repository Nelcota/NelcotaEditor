import { rm } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { deleteAvatarPhotos } from "#/modules/auth/server/avatar-storage.server";
import { isVideoWorking } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";

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
 * @returns The deleted video ids, or null when the account does not exist.
 * @throws {AccountHasWorkingVideosError} When a video is being processed; nothing is deleted.
 */
export async function deleteUserAccountRecords(userId: string): Promise<Array<string> | null> {
    return db.transaction(async (transaction) => {
        const lockedUsers = await transaction
            .select({ id: user.id })
            .from(user)
            .where(eq(user.id, userId))
            .for("update");

        if (lockedUsers.length === 0) {
            return null;
        }

        const userVideos = await transaction
            .select({ id: videos.id, status: videos.status })
            .from(videos)
            .where(eq(videos.userId, userId))
            .for("update");

        if (userVideos.some((video) => isVideoWorking(video.status)) === true) {
            throw new AccountHasWorkingVideosError(userId);
        }

        await transaction.delete(user).where(eq(user.id, userId));
        return userVideos.map((video) => video.id);
    });
}

/** Removes the files of videos whose rows are already gone. */
async function deleteVideoFiles(videoIds: Array<string>): Promise<void> {
    await Promise.all(
        videoIds.map((videoId) =>
            rm(resolveStoragePath(getVideoDirectory(videoId)), { recursive: true, force: true }),
        ),
    );
}

/**
 * The one way an account is deleted, by its owner or by an admin: the rows first, in one
 * transaction, then the video files and the profile photo once the delete is committed.
 *
 * @returns False when the account does not exist.
 * @throws {AccountHasWorkingVideosError} When a video is being processed; nothing is deleted.
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
