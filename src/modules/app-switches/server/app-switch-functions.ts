import { createServerFn } from "@tanstack/react-start";
import type { AppSwitchStates } from "#/modules/app-switches/model/app-switch";
import { readAppSwitchStates } from "#/modules/app-switches/server/app-switches.server";

/**
 * Open to everyone: the sign-up page asks before anyone signs in, and the states say only which
 * features are paused. The screens use it to explain; every feature checks its switch itself.
 */
export const getAppSwitchStates = createServerFn({ method: "GET" }).handler(
    async (): Promise<AppSwitchStates> => readAppSwitchStates(),
);
