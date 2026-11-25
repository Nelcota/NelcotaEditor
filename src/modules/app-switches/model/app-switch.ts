import { z } from "zod";

/** Every switch the code checks; the admin cannot add one, since nothing would read it. */
export const APP_SWITCH_KEYS = [
    "sign-up",
    "email-verification",
    "youtube-links",
    "file-uploads",
    "clip-sharing",
    "video-processing",
    "support",
    "maintenance-mode",
] as const;

export type AppSwitchKey = (typeof APP_SWITCH_KEYS)[number];

export type AppSwitchStates = Readonly<Record<AppSwitchKey, boolean>>;

export const appSwitchKeySchema = z.enum(APP_SWITCH_KEYS);

/** A switch nobody has touched has no row and keeps this state, so a new database needs no seed. */
export const DEFAULT_APP_SWITCH_STATES: AppSwitchStates = {
    "sign-up": true,
    "email-verification": true,
    "youtube-links": true,
    "file-uploads": true,
    "clip-sharing": true,
    "video-processing": true,
    support: true,
    "maintenance-mode": false,
};

/** Before the states load, a screen shows the default; the server checks the real one anyway. */
export function readSwitchState(states: AppSwitchStates | undefined, key: AppSwitchKey): boolean {
    if (states === undefined) {
        return DEFAULT_APP_SWITCH_STATES[key];
    }

    return states[key];
}
