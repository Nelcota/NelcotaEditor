import { THEME_BAR_COLORS } from "#/shared/theme/theme";
import { THEME_BOOTSTRAP_SCRIPT } from "#/shared/theme/theme-bootstrap-script";

/**
 * Matches --background so the mobile browser bar blends with the app; the theme script swaps it
 * when the person picks the dark theme.
 */
export const THEME_COLOR_META = {
    name: "theme-color",
    content: THEME_BAR_COLORS.dark,
    "data-light-color": THEME_BAR_COLORS.light,
    "data-dark-color": THEME_BAR_COLORS.dark,
};

/** Runs before the first paint so a saved dark theme never flashes light. */
export const THEME_HEAD_SCRIPT = { children: THEME_BOOTSTRAP_SCRIPT };
