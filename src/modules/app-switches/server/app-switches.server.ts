import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import { DEFAULT_APP_SWITCH_STATES } from "#/modules/app-switches/model/app-switch";
import type { AppSwitchKey, AppSwitchStates } from "#/modules/app-switches/model/app-switch";
import { FeatureTurnedOffError } from "#/modules/app-switches/model/feature-turned-off-error";

interface AppSwitchChange {
    key: AppSwitchKey;
    isEnabled: boolean;
    adminId: string;
}

// No cache: one primary key lookup per check, and a change reaches the web server and the worker
// (separate processes) on their next check. A failed read fails the action instead of guessing.
export async function isAppSwitchEnabled(key: AppSwitchKey): Promise<boolean> {
    const rows = await db
        .select({ isEnabled: appSwitches.isEnabled })
        .from(appSwitches)
        .where(eq(appSwitches.key, key))
        .limit(1);

    return rows[0]?.isEnabled ?? DEFAULT_APP_SWITCH_STATES[key];
}

export async function readAppSwitchStates(): Promise<AppSwitchStates> {
    const rows = await db
        .select({ key: appSwitches.key, isEnabled: appSwitches.isEnabled })
        .from(appSwitches);
    const states: Record<AppSwitchKey, boolean> = { ...DEFAULT_APP_SWITCH_STATES };

    for (const row of rows) {
        states[row.key] = row.isEnabled;
    }

    return states;
}

/** Throws the switch's own message when a feature people use is turned off. */
export async function assertFeatureEnabled(
    key: Exclude<AppSwitchKey, "video-processing" | "maintenance-mode">,
): Promise<void> {
    if ((await isAppSwitchEnabled(key)) === true) {
        return;
    }

    throw new FeatureTurnedOffError(key);
}

/** Maintenance is on when its switch is enabled; admins still use the app. */
export async function assertOutsideMaintenance(isAdmin: boolean): Promise<void> {
    if (isAdmin === true) {
        return;
    }

    if ((await isAppSwitchEnabled("maintenance-mode")) === false) {
        return;
    }

    throw new FeatureTurnedOffError("maintenance-mode");
}

/** One atomic upsert; nothing is read first, so two admins cannot race each other. */
export async function saveAppSwitch(change: AppSwitchChange): Promise<void> {
    const { key, isEnabled, adminId } = change;

    if (adminId.trim().length === 0) {
        throw new RangeError("Cannot save a switch without the admin who changed it");
    }

    await db
        .insert(appSwitches)
        .values({ key, isEnabled, updatedBy: adminId })
        .onConflictDoUpdate({
            target: appSwitches.key,
            set: { isEnabled, updatedBy: adminId, updatedAt: new Date() },
        });
}
