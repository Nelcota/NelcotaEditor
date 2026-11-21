import { getRouteApi } from "@tanstack/react-router";

const appRoute = getRouteApi("/_app");

/** The first word of the signed-in person's name, for greetings. */
export function useFirstName(): string {
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;
    const firstWord = user.name.trim().split(/\s+/)[0];

    if (firstWord === undefined || firstWord.length === 0) {
        return user.name;
    }

    return firstWord;
}
