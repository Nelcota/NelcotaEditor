import { queryOptions } from "@tanstack/react-query";
import type { EditView } from "#/modules/viral-formats/model/edit-view";
import { listMyEdits } from "#/modules/viral-formats/server/edit-functions";

/** While an edit is on its way, Minhas edições checks every few seconds for it to finish. */
const WORKING_CHECK_MILLISECONDS = 5000;

function hasWorkingEdit(editList: ReadonlyArray<EditView> | undefined): boolean {
    return (editList ?? []).some((edit) => edit.status === "queued" || edit.status === "rendering");
}

export function myEditsQueryOptions() {
    return queryOptions({
        queryKey: ["edits"],
        queryFn: () => listMyEdits(),
        refetchInterval: (query) => {
            if (hasWorkingEdit(query.state.data) === false) {
                return false;
            }

            return WORKING_CHECK_MILLISECONDS;
        },
        refetchIntervalInBackground: false,
    });
}
