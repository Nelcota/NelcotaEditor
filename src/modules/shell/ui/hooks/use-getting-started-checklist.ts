import { getRouteApi } from "@tanstack/react-router";
import { CHECKLIST_STEPS, toChecklistStorageKey } from "#/modules/shell/model/getting-started";
import type { ChecklistStep, ChecklistStepId } from "#/modules/shell/model/getting-started";
import { useStoredFlag } from "#/shared/ui/use-stored-flag";

const appRoute = getRouteApi("/_app");

export interface ChecklistEntry extends ChecklistStep {
    isDone: boolean;
    toggle: () => void;
}

interface GettingStartedChecklist {
    entries: ReadonlyArray<ChecklistEntry>;
    doneCount: number;
    totalCount: number;
    markDone: (stepId: ChecklistStepId) => void;
}

/** The "Comece por aqui" checklist, remembered in this browser for the signed-in person. */
export function useGettingStartedChecklist(): GettingStartedChecklist {
    const routeContext = appRoute.useRouteContext();
    const userId = routeContext.user.id;
    // One flag per step, called in a fixed order so the hook calls never change between renders.
    const flags: Record<ChecklistStepId, { isOn: boolean; toggle: () => void }> = {
        lesson: useStoredFlag(toChecklistStorageKey(userId, "lesson")),
        account: useStoredFlag(toChecklistStorageKey(userId, "account")),
        install: useStoredFlag(toChecklistStorageKey(userId, "install")),
        pro: useStoredFlag(toChecklistStorageKey(userId, "pro")),
    };
    const entries = CHECKLIST_STEPS.map((step) => {
        const flag = flags[step.id];

        return { ...step, isDone: flag.isOn, toggle: flag.toggle };
    });
    const doneCount = entries.filter((entry) => entry.isDone === true).length;

    function markDone(stepId: ChecklistStepId): void {
        const flag = flags[stepId];

        if (flag.isOn === true) {
            return;
        }

        flag.toggle();
    }

    return { entries, doneCount, totalCount: entries.length, markDone };
}
