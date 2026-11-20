/** `aria-current="page"` only on the link to where the person is; absent everywhere else. */
export function toAriaCurrent(isCurrent: boolean): "page" | undefined {
    if (isCurrent === false) {
        return undefined;
    }

    return "page";
}
