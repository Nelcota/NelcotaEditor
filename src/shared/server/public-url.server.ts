import { getEnvironment } from "#/shared/server/env.server";

/**
 * An absolute link to a path of the app, for places that have no page around them to resolve a
 * relative one. Development may run without an explicit origin and keep relative paths.
 */
export function toPublicUrl(pathname: string): string {
    const appUrl = getEnvironment().BETTER_AUTH_URL;

    if (pathname.startsWith("/") === false) {
        throw new RangeError(`A public path must start with a slash: ${pathname}`);
    }

    if (appUrl === undefined) {
        return pathname;
    }

    return new URL(pathname, appUrl).toString();
}
