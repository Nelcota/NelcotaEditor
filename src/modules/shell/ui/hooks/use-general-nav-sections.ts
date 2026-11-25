import { getRouteApi } from "@tanstack/react-router";
import { ADMIN_SECTION, GENERAL_NAV_GROUP } from "#/modules/shell/model/nav-sections";
import type { NavSection } from "#/modules/shell/model/nav-sections";

const appRoute = getRouteApi("/_app");
const ADMIN_GENERAL_SECTIONS = [...GENERAL_NAV_GROUP.sections, ADMIN_SECTION];

export function useGeneralNavSections(): ReadonlyArray<NavSection> {
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;

    if (user.isAdmin === true) {
        return ADMIN_GENERAL_SECTIONS;
    }

    return GENERAL_NAV_GROUP.sections;
}
