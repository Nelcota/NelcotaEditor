import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import { FeatureTurnedOffError } from "#/modules/app-switches/model/feature-turned-off-error";
import {
    assertFeatureEnabled,
    assertOutsideMaintenance,
    isAppSwitchEnabled,
    readAppSwitchStates,
    saveAppSwitch,
} from "#/modules/app-switches/server/app-switches.server";

// Runs against the test database from .env.test: bun run test:integration

const ADMIN_ID = randomUUID();

describe("app switches", () => {
    beforeEach(async () => {
        await db.delete(appSwitches);
    });

    afterAll(async () => {
        await db.delete(appSwitches);
        await db.$client.end();
    });

    it("keeps every feature on and maintenance off when nobody changed a switch", async () => {
        const states = await readAppSwitchStates();

        expect(states).toEqual({
            "sign-up": true,
            "youtube-links": true,
            "file-uploads": true,
            "clip-sharing": true,
            "video-processing": true,
            support: true,
            "maintenance-mode": false,
        });
    });

    it("keeps one row per switch when it changes again", async () => {
        await saveAppSwitch({ key: "file-uploads", isEnabled: false, adminId: ADMIN_ID });
        await saveAppSwitch({ key: "file-uploads", isEnabled: true, adminId: ADMIN_ID });

        const rows = await db.select().from(appSwitches);

        expect(rows).toHaveLength(1);
        expect(await isAppSwitchEnabled("file-uploads")).toBe(true);
    });

    it("refuses a feature that is turned off with its own message", async () => {
        await saveAppSwitch({ key: "youtube-links", isEnabled: false, adminId: ADMIN_ID });

        await expect(assertFeatureEnabled("youtube-links")).rejects.toThrow(
            "O envio por link do YouTube está pausado no momento. Tente mais tarde.",
        );
    });

    it("lets a feature that is on through", async () => {
        await expect(assertFeatureEnabled("file-uploads")).resolves.toBeUndefined();
    });

    it("refuses people who are not admins during maintenance", async () => {
        await saveAppSwitch({ key: "maintenance-mode", isEnabled: true, adminId: ADMIN_ID });

        await expect(assertOutsideMaintenance(false)).rejects.toThrow(FeatureTurnedOffError);
    });

    it("lets admins through during maintenance", async () => {
        await saveAppSwitch({ key: "maintenance-mode", isEnabled: true, adminId: ADMIN_ID });

        await expect(assertOutsideMaintenance(true)).resolves.toBeUndefined();
    });

    it("lets everyone through outside maintenance", async () => {
        await expect(assertOutsideMaintenance(false)).resolves.toBeUndefined();
    });
});
