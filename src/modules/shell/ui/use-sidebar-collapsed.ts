import { useStoredFlag } from "#/shared/ui/use-stored-flag";

const STORAGE_KEY = "nelcota:sidebar-collapsed";

/** Whether the sidebar shows icons only; remembered per browser. */
export function useSidebarCollapsed(): { isCollapsed: boolean; toggle: () => void } {
    const flag = useStoredFlag(STORAGE_KEY);

    return { isCollapsed: flag.isOn, toggle: flag.toggle };
}
