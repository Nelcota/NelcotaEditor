/** Mascot, about ten letters and the close button: narrower and "Liv", "Vid" stop meaning anything. */
export const TAB_MIN_WIDTH_PIXELS = 144;
const TAB_GAP_PIXELS = 4;
const NEW_VIDEO_BUTTON_PIXELS = 40;
const MORE_TABS_BUTTON_PIXELS = 48;
// Each slot is an item plus the gap after it: the tab list, "+N" and the plus sit in one flex row.
const TAB_SLOT_PIXELS = TAB_MIN_WIDTH_PIXELS + TAB_GAP_PIXELS;
const MORE_TABS_SLOT_PIXELS = MORE_TABS_BUTTON_PIXELS + TAB_GAP_PIXELS;

export interface SplitTabs<Tab> {
    visible: Array<Tab>;
    hidden: Array<Tab>;
}

/**
 * How many tabs fit at their minimum width beside the plus button. When some do not fit, room is
 * also kept for the "+N" button that lists the rest.
 */
export function countVisibleTabs(availableWidthPixels: number, tabCount: number): number {
    if (Number.isFinite(availableWidthPixels) === false || availableWidthPixels < 0) {
        throw new RangeError(
            `Available width must be a non-negative number, got ${availableWidthPixels}`,
        );
    }

    if (Number.isInteger(tabCount) === false || tabCount < 0) {
        throw new RangeError(`Tab count must be a non-negative integer, got ${tabCount}`);
    }

    if (tabCount === 0) {
        return 0;
    }

    if (tabCount * TAB_SLOT_PIXELS + NEW_VIDEO_BUTTON_PIXELS <= availableWidthPixels) {
        return tabCount;
    }

    const widthForTabs = availableWidthPixels - NEW_VIDEO_BUTTON_PIXELS - MORE_TABS_SLOT_PIXELS;
    const fittingTabs = Math.floor(widthForTabs / TAB_SLOT_PIXELS);

    return Math.min(Math.max(fittingTabs, 0), tabCount - 1);
}

/** Keeps the opening order, but the tab in view always stays visible, in the last visible slot. */
export function splitOpenTabs<Tab extends { id: string }>(
    tabs: Array<Tab>,
    visibleCount: number,
    currentId: string | undefined,
): SplitTabs<Tab> {
    if (Number.isInteger(visibleCount) === false || visibleCount < 0) {
        throw new RangeError(`Visible count must be a non-negative integer, got ${visibleCount}`);
    }

    const visible = tabs.slice(0, visibleCount);
    const hidden = tabs.slice(visibleCount);
    const currentHiddenIndex = hidden.findIndex((tab) => tab.id === currentId);
    const currentTab = hidden[currentHiddenIndex];

    if (visible.length === 0 || currentTab === undefined) {
        return { visible, hidden };
    }

    const lastVisibleIndex = visible.length - 1;
    const lastVisible = visible[lastVisibleIndex];

    if (lastVisible === undefined) {
        return { visible, hidden };
    }

    return {
        visible: visible.with(lastVisibleIndex, currentTab),
        hidden: [lastVisible, ...hidden.toSpliced(currentHiddenIndex, 1)],
    };
}
