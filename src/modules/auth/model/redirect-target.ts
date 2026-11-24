import type { SignInSearch } from "#/modules/auth/model/sign-in-search";
export const DEFAULT_REDIRECT_TARGET = "/";

// Any origin works: a target that stays on it is a path of the app, whatever the real host is.
const PROBE_ORIGIN = "http://redirect-target.invalid";

// Browsers drop tabs and line breaks inside URLs, so "/\t/evil.example" would become "//evil...".
const UNSAFE_CHARACTERS = /[\s\\]/;

/**
 * Whether a `?redirect=` value is a path inside the app. Anything else (another site, a
 * protocol-relative "//host", a "javascript:" URL) could send the user away after signing in.
 */
export function isAppPath(target: string): boolean {
    if (target.startsWith("/") === false || target.startsWith("//") === true) {
        return false;
    }

    if (UNSAFE_CHARACTERS.test(target) === true) {
        return false;
    }

    return new URL(target, PROBE_ORIGIN).origin === PROBE_ORIGIN;
}

/** Where to go after signing in: the page that asked for it, or home. */
export function toRedirectTarget(search: Pick<SignInSearch, "redirect">): string {
    return search.redirect ?? DEFAULT_REDIRECT_TARGET;
}
