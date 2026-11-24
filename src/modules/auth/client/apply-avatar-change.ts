import { AVATAR_TOO_LARGE_MESSAGE, MAX_AVATAR_BYTES } from "#/modules/auth/model/avatar";
import { uploadAvatar } from "#/modules/auth/client/upload-avatar";
import { chooseAvatarMascot, removeAvatar } from "#/modules/auth/server/avatar-functions";

export type AvatarChange =
    | { kind: "upload"; file: File }
    | { kind: "mascot"; index: number }
    | { kind: "remove" };

class AvatarFileTooLargeError extends Error {
    constructor() {
        super(AVATAR_TOO_LARGE_MESSAGE);
        this.name = "AvatarFileTooLargeError";
    }
}

export async function applyAvatarChange(change: AvatarChange): Promise<void> {
    if (change.kind === "upload") {
        // Checked here only to answer fast; the server checks again.
        if (change.file.size > MAX_AVATAR_BYTES) {
            throw new AvatarFileTooLargeError();
        }

        await uploadAvatar(change.file);
        return;
    }

    if (change.kind === "mascot") {
        await chooseAvatarMascot({ data: { index: change.index } });
        return;
    }

    await removeAvatar();
}
