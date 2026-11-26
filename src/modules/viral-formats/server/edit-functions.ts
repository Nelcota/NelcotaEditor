import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import type { EditView } from "#/modules/viral-formats/model/edit-view";
import { listUserEdits } from "#/modules/viral-formats/server/edit-queries.server";

export const listMyEdits = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<Array<EditView>> => listUserEdits(context.user.id));
