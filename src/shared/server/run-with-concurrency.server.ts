/**
 * Runs `task` for every item with at most `limit` running at once.
 * Results keep the order of `items`. The first failure rejects the whole run and stops
 * starting new items (tasks already running finish on their own).
 */
export async function runWithConcurrency<Item, Result>(
    items: ReadonlyArray<Item>,
    limit: number,
    task: (item: Item, index: number) => Promise<Result>,
): Promise<Array<Result>> {
    if (Number.isInteger(limit) === false || limit < 1) {
        throw new RangeError(`Concurrency limit must be a positive integer, got ${limit}`);
    }

    const results: Array<Result> = [];
    // One iterator shared by every lane, so each item is taken exactly once.
    const entries = items.entries();
    let hasFailed = false;

    const runLane = async (): Promise<void> => {
        for (const [index, item] of entries) {
            if (hasFailed === true) {
                return;
            }

            try {
                results[index] = await task(item, index);
            } catch (error) {
                hasFailed = true;
                throw error;
            }
        }
    };

    const laneCount = Math.min(limit, items.length);
    await Promise.all(Array.from({ length: laneCount }, runLane));
    return results;
}
