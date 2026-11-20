import { betterAuth } from "better-auth";
import type { User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db/database.server";
import { VIDEOS_STILL_PROCESSING_CODE } from "#/modules/auth/auth-error-message";
import { MIN_PASSWORD_LENGTH } from "#/modules/auth/auth-forms.schema";
import { account, session, user, verification } from "#/modules/auth/auth.schema";
import { deleteAvatarPhotos } from "#/modules/auth/server/avatar-storage.server";
import {
    deleteVideoFiles,
    hasWorkingVideos,
    listUserVideoIds,
} from "#/modules/videos/server/delete-user-videos.server";
import { getEnvironment, InvalidEnvironmentError } from "#/shared/server/env.server";

const MIN_SECRET_LENGTH = 32;

const environment = getEnvironment();

function readAuthSecret(): string {
    const secret = environment.BETTER_AUTH_SECRET;

    if (secret === undefined || secret.length < MIN_SECRET_LENGTH) {
        throw new InvalidEnvironmentError(["BETTER_AUTH_SECRET"]);
    }

    return secret;
}

// Video ids of accounts being deleted: read before the rows go (with the user, through the
// foreign keys), used after the delete succeeds so no file is removed for an account that stays.
const videoIdsOfDeletedUsers = new Map<string, Array<string>>();

/** The worker may be writing files of a video in progress, so those must be cancelled first. */
async function prepareUserDeletion(deletedUser: User): Promise<void> {
    const userId = deletedUser.id;

    if ((await hasWorkingVideos(userId)) === true) {
        throw new APIError("BAD_REQUEST", {
            message: "Cancele os vídeos em processamento antes de excluir a conta.",
            code: VIDEOS_STILL_PROCESSING_CODE,
        });
    }

    videoIdsOfDeletedUsers.set(userId, await listUserVideoIds(userId));
}

async function removeDeletedUserFiles(deletedUser: User): Promise<void> {
    const userId = deletedUser.id;
    const videoIds = videoIdsOfDeletedUsers.get(userId) ?? [];
    videoIdsOfDeletedUsers.delete(userId);

    await deleteVideoFiles(videoIds);
    await deleteAvatarPhotos(userId);
}

export const auth = betterAuth({
    baseURL: environment.BETTER_AUTH_URL,
    secret: readAuthSecret(),
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user, session, account, verification },
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: MIN_PASSWORD_LENGTH,
    },
    user: {
        // Better Auth checks the password sent with the request before calling the hook.
        deleteUser: {
            enabled: true,
            beforeDelete: prepareUserDeletion,
            afterDelete: removeDeletedUserFiles,
        },
    },
    plugins: [tanstackStartCookies()],
});
