import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import type { AdminAppSwitch } from "#/modules/admin/model/admin-app-switches";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import {
    APP_SWITCH_KEYS,
    DEFAULT_APP_SWITCH_STATES,
} from "#/modules/app-switches/model/app-switch";
import { user } from "#/modules/auth/auth.schema";

/** Every known switch, in the code's order; one never changed shows its default and no author. */
export async function listAdminAppSwitches(): Promise<Array<AdminAppSwitch>> {
    const rows = await db
        .select({
            key: appSwitches.key,
            isEnabled: appSwitches.isEnabled,
            updatedAt: appSwitches.updatedAt,
            adminName: user.name,
        })
        .from(appSwitches)
        // Left join: the admin who changed it may have been deleted since.
        .leftJoin(user, eq(user.id, appSwitches.updatedBy));
    const rowsByKey = new Map(rows.map((row) => [row.key, row]));

    return APP_SWITCH_KEYS.map((key) => {
        const row = rowsByKey.get(key);

        if (row === undefined) {
            return {
                key,
                isEnabled: DEFAULT_APP_SWITCH_STATES[key],
                changedAt: null,
                changedByName: null,
            };
        }

        return {
            key,
            isEnabled: row.isEnabled,
            changedAt: row.updatedAt.toISOString(),
            changedByName: row.adminName,
        };
    });
}
