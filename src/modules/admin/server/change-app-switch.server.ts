import type { SetAdminAppSwitchInput } from "#/modules/admin/model/admin-app-switches";
import { recordAdminAction } from "#/modules/admin/server/record-admin-action.server";
import { saveAppSwitch } from "#/modules/app-switches/server/app-switches.server";

/** Saves the switch, then puts the change on the admin audit log. */
export async function changeAppSwitch(
    adminId: string,
    change: SetAdminAppSwitchInput,
): Promise<void> {
    const { key, isEnabled } = change;

    await saveAppSwitch({ key, isEnabled, adminId });
    await recordAdminAction({
        action: "set-app-switch",
        adminId,
        targetUserId: null,
        videoId: null,
        details: { switchKey: key, isEnabled },
    });
}
