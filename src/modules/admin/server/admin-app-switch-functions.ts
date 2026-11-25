import { createServerFn } from "@tanstack/react-start";
import { setAdminAppSwitchInputSchema } from "#/modules/admin/model/admin-app-switches";
import type { AdminAppSwitch } from "#/modules/admin/model/admin-app-switches";
import { adminMiddleware } from "#/modules/admin/server/admin-middleware";
import { listAdminAppSwitches } from "#/modules/admin/server/admin-app-switch-rows.server";
import { changeAppSwitch } from "#/modules/admin/server/change-app-switch.server";

export const getAdminAppSwitches = createServerFn({ method: "GET" })
    .middleware([adminMiddleware])
    .handler(async (): Promise<Array<AdminAppSwitch>> => listAdminAppSwitches());

export const setAdminAppSwitch = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(setAdminAppSwitchInputSchema)
    .handler(async ({ context, data }): Promise<void> => changeAppSwitch(context.admin.id, data));
