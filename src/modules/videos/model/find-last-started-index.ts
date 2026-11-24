interface Timed {
    startSeconds: number;
}

/**
 * The index of the last item that starts at or before `seconds`, or -1 when none does. A binary
 * search: callers run it on every player tick, over lists sorted by start (cues, transcript lines).
 */
export function findLastStartedIndex(items: ReadonlyArray<Timed>, seconds: number): number {
    if (Number.isFinite(seconds) === false) {
        return -1;
    }

    let low = 0;
    let high = items.length - 1;
    let found = -1;

    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const item = items[middle];

        if (item === undefined) {
            return found;
        }

        if (item.startSeconds <= seconds) {
            found = middle;
            low = middle + 1;
            continue;
        }

        high = middle - 1;
    }

    return found;
}
