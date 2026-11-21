import { getRouteApi } from "@tanstack/react-router";
import { ADMIN_SECTION, NAV_SECTIONS } from "#/modules/shell/ui/nav-sections";
import type { NavSection } from "#/modules/shell/ui/nav-sections";

const appRoute = getRouteApi("/_app");

/** The bar's sections; admins also get Admin. */
export function useNavSections(): ReadonlyArray<NavSection> {
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;

    if (user.isAdmin === true) {
        return [...NAV_SECTIONS, ADMIN_SECTION];
    }

    return NAV_SECTIONS;
}
